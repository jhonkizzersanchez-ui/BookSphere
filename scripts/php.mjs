import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const backend = fileURLToPath(new URL('../backend/', import.meta.url));
export const php = process.env.PHP_BIN || (process.platform === 'win32' && existsSync('C:/xampp/php/php.exe') ? 'C:/xampp/php/php.exe' : 'php');

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  const args = command === 'serve' ? ['-S', 'localhost:8000', '-t', 'public', 'public/router.php']
    : command === 'setup' ? ['bin/setup.php'] : null;
  if (!args) throw new Error('Use serve or setup.');
  const child = spawn(php, args, { cwd: backend, stdio: 'inherit' });
  child.on('error', error => { process.stderr.write(`Unable to run PHP: ${error.message}. Install XAMPP or set PHP_BIN.\n`); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
}
