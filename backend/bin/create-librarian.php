<?php

declare(strict_types=1);

require dirname(__DIR__).'/src/bootstrap.php';

try {
    if ($argc !== 4) {
        throw new RuntimeException('Usage: create-librarian.php login email name (password on stdin)');
    }
    $data = ['username' => $argv[1], 'email' => $argv[2], 'fullName' => $argv[3], 'password' => rtrim((string) fgets(STDIN), "\r\n")];
    $login = textField($data, 'username', 50);
    $email = validEmail($data);
    $name = textField($data, 'fullName', 120);
    $password = validPassword($data, false);
    if (! preg_match('/^[a-zA-Z0-9._-]+$/', $login)) {
        throw new RuntimeException('Use only letters, numbers, dots, hyphens or underscores in the login ID.');
    }
    sql('INSERT INTO users (name, login_id, email, password, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [$name, $login, $email, hashPassword($password), 'librarian']);
    echo "Librarian created. Sign in and open Accounts to approve staff.\n";
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage()."\n");
    exit(1);
}
