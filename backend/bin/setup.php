<?php

declare(strict_types=1);

require dirname(__DIR__).'/src/bootstrap.php';

try {
    installSchema();
    $storage = appConfig()['storage'];
    if (! is_dir($storage) && ! mkdir($storage, 0700, true) && ! is_dir($storage)) {
        throw new RuntimeException('Cannot create storage directory.');
    }
    echo "BookSphere authentication tables are ready. Existing accounts were preserved.\n";
} catch (Throwable $error) {
    fwrite(STDERR, "Setup failed: ".$error->getMessage()."\n");
    exit(1);
}
