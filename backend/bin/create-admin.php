<?php

declare(strict_types=1);

require dirname(__DIR__).'/src/bootstrap.php';
require dirname(__DIR__).'/src/auth.php';

try {
    if ($argc !== 4) {
        throw new RuntimeException('Usage: create-admin.php login email name (password on stdin)');
    }
    createStaffAccount('admin', $argv[1], $argv[2], $argv[3], rtrim((string) fgets(STDIN), "\r\n"));
    echo "Admin created. Sign in with \"Administrator sign-in\" on the login page.\n";
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage()."\n");
    exit(1);
}
