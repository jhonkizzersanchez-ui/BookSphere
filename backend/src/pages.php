<?php

declare(strict_types=1);

/** Server-rendered pages (replaces the former React app). */
function handlePage(string $path): void
{
    $GLOBALS['booksphere_path'] = $path;
    try {
        startSession();
        $method = $_SERVER['REQUEST_METHOD'];
        if ($method === 'POST' && ! validFormCsrf()) {
            flashToast('Your session expired. Please try again.', 'warning');
            $query = $_GET;
            if (selectedRole(postString('role'))) {
                $query['role'] = postString('role');
            }
            header('Location: '.url($path, $query), true, 303);
            exit;
        }

        if ($path === '/') {
            redirect(currentUser() ? '/dashboard' : '/login');
        }
        if ($path === '/login') {
            $method === 'POST' ? loginSubmit() : loginForm();
        }
        if ($path === '/register') {
            $method === 'POST' ? registerSubmit() : registerForm();
        }
        if ($path === '/forgot-password') {
            $method === 'POST' ? forgotSubmit() : forgotForm();
        }
        if ($path === '/reset-password') {
            $method === 'POST' ? resetSubmit() : resetForm();
        }
        if ($path === '/logout' && $method === 'POST') {
            signOut();
            redirect('/login');
        }

        $user = requireUser();
        if ($path === '/dashboard' && $method === 'GET') {
            dashboardPage($user);
        }
        if ($path === '/catalog' && $method === 'GET') {
            appPage('catalog', $user, 'catalog', 'Book Catalog');
        }
        if ($path === '/search' && $method === 'GET') {
            appPage('search', $user, 'search', 'Search');
        }
        if (preg_match('#^/books/([A-Za-z0-9_-]+)$#', $path, $match) && $method === 'GET') {
            $book = findBook($match[1]);
            appPage('book-details', $user, 'book', $book['title'] ?? 'Book not found', ['book' => $book]);
        }
        if ($path === '/my-books' && $method === 'GET') {
            if ($user['role'] !== 'student') {
                redirect('/dashboard');
            }
            appPage('my-books', $user, 'my-books', 'My Books');
        }
        if (preg_match('#^/librarian/accounts/([0-9]+)/approve$#', $path, $match) && $method === 'POST') {
            approveSubmit($user, (int) $match[1]);
        }
        guestPage('error', 'Page not found', ['heading' => 'Page not found', 'message' => 'That page does not exist.'], 404);
    } catch (Throwable $error) {
        error_log('BookSphere page error: '.$error->getMessage());
        guestPage('error', 'Something went wrong', [
            'heading' => 'Something went wrong',
            'message' => 'The PHP backend encountered a problem. Check the database configuration and server logs.',
        ], 500);
    }
}

/* ---------- Session helpers ---------- */

function currentUser(): ?array
{
    try {
        return authenticatedUser();
    } catch (ApiException) {
        return null;
    }
}

function requireUser(): array
{
    try {
        return authenticatedUser();
    } catch (ApiException $error) {
        if ($error->status === 403) {
            flashToast($error->getMessage(), 'warning');
        }
        redirect('/login');
    }
}

function clientIp(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'local';
}

function postString(string $key): string
{
    $value = $_POST[$key] ?? '';
    return is_string($value) ? $value : '';
}

function selectedRole(?string $value, ?string $default = null): ?string
{
    return isset(roleOptions()[$value ?? '']) ? $value : $default;
}

/* ---------- Sign in ---------- */

function loginForm(array $vars = []): never
{
    if (! $vars && currentUser()) {
        redirect('/dashboard');
    }
    guestPage('auth/login', 'Sign in', $vars + [
        'role' => selectedRole(queryString('role')),
        'username' => '',
        'error' => '',
    ]);
}

function loginSubmit(): never
{
    $role = selectedRole(postString('role'));
    $username = postString('username');
    $password = postString('password');
    $error = '';
    if (! $role) {
        $error = 'Please select your role first.';
    } elseif ($username === '') {
        $error = $role === 'student' ? 'Please enter your Student ID.' : 'Please enter your username.';
    } elseif ($password === '') {
        $error = 'Please enter your password.';
    } else {
        try {
            signIn(['username' => trim($username), 'password' => $password]);
            redirect('/dashboard');
        } catch (ApiException $exception) {
            $error = $exception->errors['username'][0] ?? $exception->getMessage();
        }
    }
    loginForm(['role' => $role, 'username' => $username, 'error' => $error]);
}

/* ---------- Sign up ---------- */

const SIGNUP_FIELDS = ['fullName', 'studentId', 'email', 'grade', 'classCode', 'staffId', 'password', 'confirmPassword'];

function registerForm(array $vars = []): never
{
    $role = selectedRole(queryString('role'), 'student');
    if (! $vars && queryString('done') === '1' && ($done = takeFlash('signup'))) {
        guestPage('auth/signup-success', 'Account created', ['role' => $done['role'], 'name' => $done['name']]);
    }
    guestPage('auth/signup', 'Create an account', $vars + [
        'role' => $role,
        'old' => array_fill_keys(SIGNUP_FIELDS, ''),
        'errors' => [],
        'formError' => '',
    ]);
}

function registerSubmit(): never
{
    $role = selectedRole(postString('role'), 'student');
    $form = [];
    foreach (SIGNUP_FIELDS as $field) {
        $form[$field] = postString($field);
    }
    $errors = [];
    if (trim($form['fullName']) === '') $errors['fullName'] = 'Full name is required.';
    if ($role === 'student' && trim($form['studentId']) === '') $errors['studentId'] = 'Student ID is required.';
    if (trim($form['email']) === '') $errors['email'] = 'School email is required.';
    if ($role === 'student' && $form['grade'] === '') $errors['grade'] = 'Please select a grade.';
    if ($role === 'librarian' && trim($form['staffId']) === '') $errors['staffId'] = 'Staff ID is required.';
    if ($form['password'] === '') {
        $errors['password'] = 'Password is required.';
    } elseif (mb_strlen($form['password']) < 12 || ! preg_match('/[a-z]/i', $form['password']) || ! preg_match('/\d/', $form['password'])) {
        $errors['password'] = 'Use at least 12 characters with letters and numbers.';
    }
    if ($form['password'] !== $form['confirmPassword']) $errors['confirmPassword'] = 'Passwords do not match.';

    $formError = '';
    if (! $errors) {
        try {
            rateLimit('register:'.clientIp(), 10);
            registerAccount(['role' => $role, 'fullName' => trim($form['fullName']), 'email' => trim($form['email']), 'studentId' => trim($form['studentId']),
                'grade' => $form['grade'], 'classCode' => $form['classCode'], 'staffId' => $form['staffId'],
                'password' => $form['password'], 'password_confirmation' => $form['confirmPassword']]);
            setFlash('signup', ['name' => trim($form['fullName']), 'role' => $role]);
            redirect('/register', ['role' => $role, 'done' => '1']);
        } catch (ApiException $exception) {
            $formError = $exception->getMessage();
            foreach ($exception->errors as $field => $messages) {
                $errors[$field === 'password_confirmation' ? 'confirmPassword' : $field] = $messages[0];
            }
        }
    }
    $form['password'] = $form['confirmPassword'] = '';
    registerForm(['role' => $role, 'old' => $form, 'errors' => $errors, 'formError' => $formError]);
}

/* ---------- Password recovery ---------- */

function forgotForm(array $vars = []): never
{
    if (! $vars && queryString('sent') === '1') {
        guestPage('auth/forgot-sent', 'Reset link requested');
    }
    guestPage('auth/forgot', 'Forgot password', $vars + [
        'role' => selectedRole(queryString('role'), 'student'),
        'email' => '',
        'error' => '',
    ]);
}

function forgotSubmit(): never
{
    $email = trim(postString('email'));
    $role = selectedRole(postString('role'), 'student');
    $error = '';
    if ($email === '') {
        $error = 'Please enter your registered school email.';
    } else {
        try {
            rateLimit('forgot:'.clientIp(), 3);
            forgotPassword(['email' => $email]);
            redirect('/forgot-password', ['sent' => '1']);
        } catch (ApiException $exception) {
            $error = $exception->errors['email'][0] ?? $exception->getMessage();
        }
    }
    forgotForm(['role' => $role, 'email' => $email, 'error' => $error]);
}

function resetForm(array $vars = []): never
{
    if (! $vars && queryString('done') === '1') {
        guestPage('auth/reset-success', 'Password updated');
    }
    $vars += ['email' => queryString('email'), 'token' => queryString('reset_token'), 'error' => ''];
    if ($vars['token'] === '') {
        redirect('/forgot-password');
    }
    guestPage('auth/reset', 'Choose a new password', $vars);
}

function resetSubmit(): never
{
    $email = postString('email');
    $token = postString('token');
    try {
        rateLimit('reset:'.clientIp(), 10);
        resetPassword(['email' => $email, 'token' => $token, 'password' => postString('password'), 'password_confirmation' => postString('password_confirmation')]);
        redirect('/reset-password', ['done' => '1']);
    } catch (ApiException $exception) {
        $first = array_values($exception->errors)[0][0] ?? null;
        resetForm(['email' => $email, 'token' => $token, 'error' => $first ?? $exception->getMessage()]);
    }
}

/* ---------- Dashboards ---------- */

function dashboardPage(array $user): never
{
    if ($user['role'] === 'student') {
        appPage('student-dashboard', $user, 'dashboard', 'Dashboard');
    }
    if ($user['role'] === 'teacher') {
        appPage('teacher-dashboard', $user, 'dashboard', 'Teacher Dashboard');
    }
    $sections = ['dashboard', 'books', 'students', 'reports', 'accounts'];
    $section = in_array(queryString('section'), $sections, true) ? queryString('section') : 'dashboard';
    appPage('librarian-panel', $user, 'dashboard', 'Librarian Panel', [
        'section' => $section,
        'pendingAccounts' => $section === 'accounts' ? pendingAccounts() : [],
    ]);
}

function approveSubmit(array $user, int $id): never
{
    if ($user['role'] !== 'librarian') {
        flashToast('Librarian access is required.', 'warning');
        redirect('/dashboard');
    }
    try {
        $approved = approveAccount($id);
        flashToast($approved['name'].' approved.', 'success');
    } catch (ApiException $exception) {
        flashToast($exception->getMessage(), 'warning');
    }
    redirect('/dashboard', ['section' => 'accounts']);
}
