<?php

declare(strict_types=1);

require dirname(__DIR__).'/src/bootstrap.php';
require dirname(__DIR__).'/src/auth.php';

try {
    if ($argc !== 4) {
        throw new RuntimeException('Usage: create-librarian.php login email name (password on stdin)');
    }
    createStaffAccount('librarian', $argv[1], $argv[2], $argv[3], rtrim((string) fgets(STDIN), "\r\n"));
    echo "Librarian created. Sign in and open Accounts to approve staff.\n";
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage()."\n");
    exit(1);
}
