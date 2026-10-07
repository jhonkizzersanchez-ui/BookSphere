<?php

declare(strict_types=1);

ini_set('display_errors', '0');
require dirname(__DIR__).'/src/bootstrap.php';
require dirname(__DIR__).'/src/auth.php';

try {
    $path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/') ?: '/';
    $base = rtrim(appConfig()['base_path'], '/');
    if ($base !== '' && str_starts_with($path, $base.'/')) {
        $path = substr($path, strlen($base));
    }
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET' && $path === '/api/health') {
        jsonResponse(['service' => 'BookSphere PHP API']);
    }
    startSession();
    if ($method === 'GET' && $path === '/api/auth/csrf') {
        csrfCookie();
        jsonResponse([], 204);
    }
    if ($method === 'GET' && $path === '/api/auth/me') {
        jsonResponse(['user' => publicUser(authenticatedUser())]);
    }
    if ($method === 'GET' && $path === '/api/admin/users') {
        authenticatedUser(true);
        jsonResponse(['users' => array_map('publicUser', sql('SELECT * FROM users WHERE is_active = 0 ORDER BY created_at, id LIMIT 100')->fetchAll())]);
    }
    if ($method !== 'POST') {
        throw new ApiException('Endpoint not found.', 404);
    }
    requireCsrf();
    $data = requestBody();
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'local';
    if ($path === '/api/auth/register') {
        rateLimit('register:'.$ip, 10);
        jsonResponse(['user' => registerAccount($data)], 201);
    }
    if ($path === '/api/auth/login') {
        jsonResponse(['user' => signIn($data)]);
    }
    if ($path === '/api/auth/logout') {
        authenticatedUser();
        $_SESSION = ['csrf' => bin2hex(random_bytes(32)), 'last_seen' => time()];
        session_regenerate_id(true);
        csrfCookie();
        jsonResponse([], 204);
    }
    if ($path === '/api/auth/forgot-password') {
        rateLimit('forgot:'.$ip, 3);
        forgotPassword($data);
        jsonResponse(['message' => 'If an account exists for that email, a password reset link has been requested.']);
    }
    if ($path === '/api/auth/reset-password') {
        rateLimit('reset:'.$ip, 10);
        resetPassword($data);
        jsonResponse(['message' => 'Password updated. Sign in with your new password.']);
    }
    if (preg_match('#^/api/admin/users/([0-9]+)/approve$#', $path, $match)) {
        authenticatedUser(true);
        $user = sql('SELECT * FROM users WHERE id = ?', [(int) $match[1]])->fetch();
        if (! $user) {
            throw new ApiException('Account not found.', 404);
        }
        sql('UPDATE users SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [$user['id']]);
        $user['is_active'] = 1;
        jsonResponse(['user' => publicUser($user)]);
    }
    throw new ApiException('Endpoint not found.', 404);
} catch (ApiException $error) {
    jsonResponse(['message' => $error->getMessage(), 'errors' => $error->errors], $error->status);
} catch (Throwable $error) {
    error_log('BookSphere API error: '.$error->getMessage());
    jsonResponse(['message' => 'The PHP backend encountered a problem. Check the database configuration and server logs.'], 500);
}
