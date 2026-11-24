import { spawn } from 'node:child_process';
import { emitKeypressEvents } from 'node:readline';
import { backend, php } from './php.mjs';

const [role, ...args] = process.argv.slice(2);
const scripts = { librarian: 'bin/create-librarian.php', admin: 'bin/create-admin.php' };
if (!scripts[role] || args.length !== 3 || !process.stdin.isTTY) {
  process.stderr.write('Run interactively: npm run backend:admin -- librarian library@your-school.edu "School Librarian"\n'
    + '               or: npm run backend:create-admin -- admin admin@your-school.edu "School Admin"\n');
  process.exit(1);
}
process.stdout.write('Password (12+ characters, letters and numbers): ');
emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();
let password = '';
process.stdin.on('keypress', (text, key) => {
  if (key.ctrl && key.name === 'c') {
    process.stdin.setRawMode(false);
    process.exit(1);
  }
  if (key.name === 'return') {
    process.stdin.setRawMode(false);
    process.stdin.pause();
    process.stdout.write('\n');
    const child = spawn(php, [scripts[role], ...args], { cwd: backend, stdio: ['pipe', 'inherit', 'inherit'] });
    child.stdin.end(password + '\n');
    password = '';
    child.on('error', error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
    child.on('exit', code => { process.exitCode = code ?? 1; });
  } else if (key.name === 'backspace') {
    password = [...password].slice(0, -1).join('');
  } else if (!key.ctrl && !key.meta && text && [...text].every(character => character.codePointAt(0) > 31 && character.codePointAt(0) !== 127)) {
    password += text;
  }
});
