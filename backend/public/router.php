<?php

// Router for PHP's built-in development server: serve real static files, send everything else to index.php.
$file = realpath(__DIR__.urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/'));
if ($file !== false && is_file($file) && str_starts_with($file, __DIR__.DIRECTORY_SEPARATOR) && pathinfo($file, PATHINFO_EXTENSION) !== 'php') {
    return false;
}
require __DIR__.'/index.php';
