<?php

declare(strict_types=1);

/** JSON API kept for scripts, tests and any external clients. Pages use src/pages.php. */
function handleApi(string $path): void
{
    try {
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
            jsonResponse(['users' => array_map('publicUser', pendingAccounts())]);
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
            signOut();
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
            jsonResponse(['user' => publicUser(approveAccount((int) $match[1]))]);
        }
        throw new ApiException('Endpoint not found.', 404);
    } catch (ApiException $error) {
        jsonResponse(['message' => $error->getMessage(), 'errors' => $error->errors], $error->status);
    } catch (Throwable $error) {
        error_log('BookSphere API error: '.$error->getMessage());
        jsonResponse(['message' => 'The PHP backend encountered a problem. Check the database configuration and server logs.'], 500);
    }
}
