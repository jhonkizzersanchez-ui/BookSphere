<?php

declare(strict_types=1);

function registerAccount(array $data): array
{
    $name = textField($data, 'fullName', 120);
    $email = validEmail($data);
    $role = textField($data, 'role', 20);
    if (! in_array($role, ['student', 'teacher', 'librarian'], true)) {
        throw new ApiException('Please check the form.', 422, ['role' => ['Select a valid role.']]);
    }
    $password = validPassword($data);
    $login = $role === 'student' ? textField($data, 'studentId', 50) : $email;
    if ($role === 'student' && ! preg_match('/^[a-zA-Z0-9._-]+$/', $login)) {
        throw new ApiException('Please check the form.', 422, ['studentId' => ['Enter a valid Student ID.']]);
    }
    $grade = textField($data, 'grade', 20, $role === 'student');
    $classCode = textField($data, 'classCode', 50, false);
    $staffId = textField($data, 'staffId', 50, $role === 'librarian');
    $duplicates = sql('SELECT email, login_id FROM users WHERE email = ? OR login_id IN (?, ?)', [$email, $login, $email])->fetchAll();
    if ($duplicates) {
        $errors = ['email' => ['This email or login ID is already registered.']];
        if ($role === 'student') {
            $errors['studentId'] = ['This email or Student ID is already registered.'];
        }
        throw new ApiException('An account with these details already exists.', 422, $errors);
    }
    try {
        sql('INSERT INTO users (name, email, login_id, password, role, is_active, grade, class_code, staff_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            [$name, $email, $login, hashPassword($password), $role, $role === 'student' ? 1 : 0, $grade ?: null, $classCode ?: null, $staffId ?: null]);
    } catch (PDOException $error) {
        if ($error->getCode() === '23000') {
            throw new ApiException('An account with these details already exists.', 422, ['email' => ['This email or login ID is already registered.']]);
        }
        throw $error;
    }
    return publicUser(sql('SELECT * FROM users WHERE id = ?', [(int) database()->lastInsertId()])->fetch());
}

function signIn(array $data): array
{
    $login = textField($data, 'username', 255);
    $password = $data['password'] ?? '';
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'local';
    rateLimit('login-ip:'.$ip, 30);
    rateLimit('login:'.strtolower($login).'|'.$ip, 5);
    $column = filter_var($login, FILTER_VALIDATE_EMAIL) ? 'email' : 'login_id';
    $user = sql('SELECT * FROM users WHERE '.$column.' = ?', [$login])->fetch();
    $valid = false;
    if (is_string($password) && strlen($password) <= 72 && ! str_contains($password, "\0")) {
        if ($user) {
            $valid = password_verify($password, $user['password']);
        } else {
            hashPassword('TimingOnlyPassword123!');
        }
    }
    if (! $user || ! $valid || ! (bool) $user['is_active']) {
        throw new ApiException('Unable to sign in. Check your credentials or contact the library about account approval.', 422,
            ['username' => ['Unable to sign in. Check your credentials or contact the library about account approval.']]);
    }
    if (password_needs_rehash($user['password'], PASSWORD_BCRYPT, ['cost' => appConfig()['bcrypt_cost']])) {
        $user['password'] = hashPassword($password);
        sql('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [$user['password'], $user['id']]);
    }
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['password_hash'] = $user['password'];
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    csrfCookie();
    return publicUser($user);
}

function signOut(): void
{
    $_SESSION = ['csrf' => bin2hex(random_bytes(32)), 'last_seen' => time()];
    session_regenerate_id(true);
    csrfCookie();
}

function pendingAccounts(): array
{
    return sql('SELECT * FROM users WHERE is_active = 0 ORDER BY created_at, id LIMIT 100')->fetchAll();
}

function approveAccount(int $id): array
{
    $user = sql('SELECT * FROM users WHERE id = ?', [$id])->fetch();
    if (! $user) {
        throw new ApiException('Account not found.', 404);
    }
    sql('UPDATE users SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [$user['id']]);
    $user['is_active'] = 1;
    return $user;
}

function forgotPassword(array $data): void
{
    $email = validEmail($data);
    $user = sql('SELECT * FROM users WHERE email = ?', [$email])->fetch();
    if (! $user) {
        return;
    }
    
    $previous = sql('SELECT created_at FROM password_reset_tokens WHERE email = ?', [$email])->fetch();
    if ($previous && strtotime($previous['created_at'].' UTC') > time() - 60) {
        return;
    }
    $token = bin2hex(random_bytes(32));
    $hashed = hash('sha256', $token);
    if (appConfig()['db_driver'] === 'mysql') {
        sql('INSERT INTO password_reset_tokens (email, token, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE token = VALUES(token), created_at = CURRENT_TIMESTAMP', [$email, $hashed]);
    } else {
        sql('INSERT INTO password_reset_tokens (email, token, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(email) DO UPDATE SET token = excluded.token, created_at = CURRENT_TIMESTAMP', [$email, $hashed]);
    }
    $config = appConfig();
    $url = rtrim($config['app_url'] ?? 'http://localhost:8000', '/').rtrim($config['base_path'], '/').'/reset-password?'.http_build_query(['reset_token' => $token, 'email' => $email]);
    if ($config['mail_transport'] === 'log') {
        if (file_put_contents($config['storage'].'/mail.log', $url.PHP_EOL, FILE_APPEND | LOCK_EX) === false) {
            error_log('BookSphere could not write the local reset email log.');
        }
    } elseif ($config['mail_transport'] === 'mail') {
        $sender = $config['mail_from'];
        if (! filter_var($sender, FILTER_VALIDATE_EMAIL) || ! mail($email, 'Reset your BookSphere password',
            "Open this link to reset your password. It expires in 60 minutes:\n".$url, 'From: '.$sender)) {
            error_log('BookSphere password reset email delivery failed. Check PHP mail configuration.');
        }
    } else {
        error_log('BookSphere mail transport is not configured.');
    }
}

function resetPassword(array $data): void
{
    $email = validEmail($data);
    $token = textField($data, 'token', 255);
    $password = validPassword($data);
    $pdo = database();
    $pdo->beginTransaction();
    try {
        $locking = appConfig()['db_driver'] === 'mysql' ? ' FOR UPDATE' : '';
        $stored = sql('SELECT token, created_at FROM password_reset_tokens WHERE email = ?'.$locking, [$email])->fetch();
        if (! $stored || strtotime($stored['created_at'].' UTC') < time() - 3600 || ! hash_equals($stored['token'], hash('sha256', $token))) {
            throw new ApiException('This reset link is invalid or expired. Request a new link.', 422, ['email' => ['This reset link is invalid or expired. Request a new link.']]);
        }
        sql('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?', [hashPassword($password), $email]);
        sql('DELETE FROM password_reset_tokens WHERE email = ?', [$email]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}
