<?php

declare(strict_types=1);

ini_set('display_errors', '0');
require dirname(__DIR__).'/src/bootstrap.php';
require dirname(__DIR__).'/src/auth.php';
require dirname(__DIR__).'/src/api.php';
require dirname(__DIR__).'/src/data.php';
require dirname(__DIR__).'/src/view.php';
require dirname(__DIR__).'/src/pages.php';

$path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/', '/') ?: '/';
$base = rtrim(appConfig()['base_path'], '/');
if ($base !== '' && ($path === $base || str_starts_with($path, $base.'/'))) {
    $path = substr($path, strlen($base)) ?: '/';
}

if ($path === '/api' || str_starts_with($path, '/api/')) {
    handleApi($path);
} else {
    handlePage($path);
}
