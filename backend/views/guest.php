<?php /** @var string $title @var string $content */ ?>
<!doctype html>
<html lang="en">
<head>
<?php require __DIR__.'/partials/head.php'; ?>
</head>
<body>
<?= $content ?>
<?php require __DIR__.'/partials/toasts.php'; ?>
</body>
</html>
