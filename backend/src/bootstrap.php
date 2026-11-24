<?php

declare(strict_types=1);

date_default_timezone_set('UTC');

final class ApiException extends RuntimeException
{
    public int $status;
    public array $errors;

    public function __construct(string $message, int $status, array $errors = [])
    {
        parent::__construct($message);
        $this->status = $status;
        $this->errors = $errors;
    }
}

function appConfig(): array
{
    static $config;
    if ($config === null) {
        $local = dirname(__DIR__).'/config.php';
        $config = require is_file($local) ? $local : dirname(__DIR__).'/config.example.php';
        $config['storage'] = getenv('BOOKSPHERE_STORAGE') ?: dirname(__DIR__).'/storage';
        $config['db_driver'] = getenv('BOOKSPHERE_DB_DRIVER') ?: 'mysql';
        $config['mail_transport'] = getenv('BOOKSPHERE_MAIL_TRANSPORT') ?: $config['mail_transport'];
        $config['bcrypt_cost'] = (int) (getenv('BOOKSPHERE_BCRYPT_COST') ?: $config['bcrypt_cost']);
    }
    return $config;
}

function database(): PDO
{
    static $pdo;
    if ($pdo === null) {
        $config = appConfig();
        if ($config['db_driver'] === 'sqlite') {
            $path = getenv('BOOKSPHERE_SQLITE_PATH');
            if (! $path) {
                throw new RuntimeException('An isolated SQLite path is required.');
            }
            $pdo = new PDO('sqlite:'.$path);
            $pdo->exec('PRAGMA busy_timeout=5000');
        } else {
            $pdo = new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                $config['db_host'], $config['db_port'], $config['db_name']), $config['db_user'], $config['db_password']);
            $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
            $pdo->exec("SET time_zone = '+00:00'");
        }
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }
    return $pdo;
}

function sql(string $statement, array $parameters = []): PDOStatement
{
    $query = database()->prepare($statement);
    $query->execute($parameters);
    return $query;
}

function installSchema(): void
{
    if (appConfig()['db_driver'] === 'mysql') {
        database()->exec(file_get_contents(dirname(__DIR__).'/schema.sql'));
    } else {
        database()->exec('CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, login_id TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT "student",
            is_active INTEGER NOT NULL DEFAULT 0, deactivated_at TEXT NULL, grade TEXT, class_code TEXT, staff_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        ); CREATE TABLE IF NOT EXISTS password_reset_tokens (
            email TEXT PRIMARY KEY, token TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
        ); CREATE TABLE IF NOT EXISTS auth_rate_limits (bucket TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL);');
    }
    upgradeSchema();
}

/** Adds columns introduced after the first release to databases that already exist. */
function upgradeSchema(): void
{
    if (appConfig()['db_driver'] === 'mysql') {
        $exists = (int) sql("SELECT COUNT(*) FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'deactivated_at'")->fetchColumn();
        if ($exists === 0) {
            database()->exec('ALTER TABLE users ADD COLUMN deactivated_at TIMESTAMP NULL DEFAULT NULL AFTER is_active');
        }
    } elseif (! in_array('deactivated_at', array_column(sql('PRAGMA table_info(users)')->fetchAll(), 'name'), true)) {
        database()->exec('ALTER TABLE users ADD COLUMN deactivated_at TEXT NULL');
    }
}

/** True when a query failed because a column added by a newer release is missing (setup has not run yet). */
function databaseNeedsUpdate(Throwable $error): bool
{
    return $error instanceof PDOException
        && ($error->getCode() === '42S22' || stripos($error->getMessage(), 'no such column') !== false);
}

function jsonResponse(array $body = [], int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    if ($status !== 204) {
        echo json_encode($body, JSON_THROW_ON_ERROR);
    }
    exit;
}

function startSession(): void
{
    $config = appConfig();
    $directory = $config['storage'].'/sessions';
    if (! is_dir($directory) && ! mkdir($directory, 0700, true) && ! is_dir($directory)) {
        throw new RuntimeException('Cannot create the session directory.');
    }
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', (string) $config['session_lifetime']);
    session_save_path($directory);
    session_name('BOOKSPHERE_SESSION');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $config['secure_cookies'], 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
    if (isset($_SESSION['last_seen']) && $_SESSION['last_seen'] < time() - $config['session_lifetime']) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    $_SESSION['last_seen'] = time();
    $_SESSION['csrf'] = $_SESSION['csrf'] ?? bin2hex(random_bytes(32));
}

function csrfCookie(): void
{
    setcookie('XSRF-TOKEN', $_SESSION['csrf'], ['expires' => 0, 'path' => '/', 'secure' => appConfig()['secure_cookies'], 'httponly' => false, 'samesite' => 'Lax']);
}

function requireCsrf(): void
{
    $token = $_SERVER['HTTP_X_XSRF_TOKEN'] ?? '';
    if (! is_string($token) || ! hash_equals($_SESSION['csrf'], $token)) {
        throw new ApiException('Your session expired. Please try again.', 419);
    }
}

function requestBody(): array
{
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
        throw new ApiException('Send an application/json request.', 415);
    }
    $raw = file_get_contents('php://input', false, null, 0, 65537);
    if (strlen($raw) > 65536) {
        throw new ApiException('Request is too large.', 413);
    }
    try {
        $data = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        throw new ApiException('Invalid JSON request.', 400);
    }
    if (! is_array($data) || ! str_starts_with(ltrim($raw), '{')) {
        throw new ApiException('Send a JSON object.', 400);
    }
    return $data;
}

function textField(array $data, string $field, int $max, bool $required = true): string
{
    $value = $data[$field] ?? '';
    if (! is_string($value) || ! mb_check_encoding($value, 'UTF-8') || mb_strlen($value, 'UTF-8') > $max || ($required && trim($value) === '')) {
        throw new ApiException('Please check the form.', 422, [$field => ['Enter a valid '. $field.'.']]);
    }
    return trim($value);
}

function validEmail(array $data): string
{
    $email = strtolower(textField($data, 'email', 255));
    if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new ApiException('Please check the form.', 422, ['email' => ['Enter a valid email address.']]);
    }
    return $email;
}

function validPassword(array $data, bool $confirmed = true): string
{
    $password = $data['password'] ?? null;
    if (! is_string($password) || ! mb_check_encoding($password, 'UTF-8') || str_contains($password, "\0") || strlen($password) > 72 || mb_strlen($password, 'UTF-8') < 12 || ! preg_match('/\p{L}/u', $password) || ! preg_match('/[0-9]/', $password)) {
        throw new ApiException('Please check the form.', 422, ['password' => ['Use at least 12 characters with letters and numbers. If your password is very long, use fewer characters.']]);
    }
    if ($confirmed && (! isset($data['password_confirmation']) || $password !== $data['password_confirmation'])) {
        throw new ApiException('Please check the form.', 422, ['password_confirmation' => ['Passwords do not match.']]);
    }
    return $password;
}

function hashPassword(string $password): string
{
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => appConfig()['bcrypt_cost']]);
}

function publicUser(array $user): array
{
    return ['id' => (int) $user['id'], 'name' => $user['name'], 'email' => $user['email'],
        'login_id' => $user['login_id'], 'role' => $user['role'], 'is_active' => (bool) $user['is_active'],
        'grade' => $user['grade'], 'class_code' => $user['class_code']];
}

function authenticatedUser(bool $librarianOnly = false): array
{
    $user = isset($_SESSION['user_id']) ? sql('SELECT * FROM users WHERE id = ?', [$_SESSION['user_id']])->fetch() : false;
    if (! $user || ! isset($_SESSION['password_hash']) || ! hash_equals($user['password'], $_SESSION['password_hash'])) {
        unset($_SESSION['user_id'], $_SESSION['password_hash']);
        throw new ApiException('Unauthenticated.', 401);
    }
    if (! (bool) $user['is_active']) {
        unset($_SESSION['user_id'], $_SESSION['password_hash']);
        throw new ApiException('This account is awaiting approval or has been disabled.', 403);
    }
    if ($librarianOnly && ! in_array($user['role'], ['librarian', 'admin'], true)) {
        throw new ApiException('Librarian access is required.', 403);
    }
    return $user;
}

function rateLimit(string $key, int $maximum, int $seconds = 60): void
{
    $bucket = hash('sha256', $key);
    $now = time();
    if (appConfig()['db_driver'] === 'mysql') {
        sql('INSERT INTO auth_rate_limits (bucket, hits, expires_at) VALUES (?, 1, ?)
            ON DUPLICATE KEY UPDATE hits = IF(expires_at <= ?, 1, hits + 1),
            expires_at = IF(expires_at <= ?, VALUES(expires_at), expires_at)', [$bucket, $now + $seconds, $now, $now]);
    } else {
        sql('INSERT INTO auth_rate_limits (bucket, hits, expires_at) VALUES (?, 1, ?)
            ON CONFLICT(bucket) DO UPDATE SET hits = CASE WHEN expires_at <= ? THEN 1 ELSE hits + 1 END,
            expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END', [$bucket, $now + $seconds, $now, $now]);
    }
    $limit = sql('SELECT hits, expires_at FROM auth_rate_limits WHERE bucket = ?', [$bucket])->fetch();
    if ((int) $limit['hits'] > $maximum) {
        header('Retry-After: '.max(1, (int) $limit['expires_at'] - $now));
        throw new ApiException('Too many attempts. Wait a minute and try again.', 429);
    }
}
