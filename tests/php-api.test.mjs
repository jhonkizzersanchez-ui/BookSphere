import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { backend, php } from '../scripts/php.mjs';

let server, base, temporary;
const environment = { ...process.env };
const seed = (args, input) => {
  const result = spawnSync(php, args, { cwd: backend, env: environment, input, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
};
before(async () => {
  temporary = await mkdtemp(join(tmpdir(), 'booksphere-auth-'));
  environment.BOOKSPHERE_DB_DRIVER = 'sqlite';
  environment.BOOKSPHERE_SQLITE_PATH = join(temporary, 'test.sqlite');
  environment.BOOKSPHERE_STORAGE = temporary;
  environment.BOOKSPHERE_MAIL_TRANSPORT = 'log';
  environment.BOOKSPHERE_BCRYPT_COST = '4';
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}`;
  server = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', 'public', 'public/router.php'], { cwd: backend, env: environment, stdio: 'ignore' });
  for (let attempt = 0; attempt < 50; attempt++) {
    try { await fetch(base + '/api/health'); return; } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  throw new Error('PHP test server did not start.');
});
after(async () => {
  if (server && server.exitCode === null) {
    const exited = new Promise(resolve => server.once('exit', resolve));
    server.kill();
    await exited;
  }
  if (temporary) await rm(temporary, { recursive: true, force: true });
});

test('the plain PHP health endpoint is available', async () => {
  const response = await fetch(base + '/api/health');
  assert.equal(response.status, 200);
  assert.equal((await response.json()).service, 'BookSphere PHP API');
});

const client = () => {
  const cookies = new Map();
  let csrf;
  const request = async (path, data, options = {}) => {
    const headers = { Accept: 'application/json', Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; ') };
    if (data !== undefined) {
      headers['Content-Type'] = 'application/json';
      if (!options.skipCsrf) headers['X-XSRF-TOKEN'] = csrf;
    }
    const response = await fetch(base + path, { method: data === undefined ? 'GET' : 'POST', headers, body: data === undefined ? undefined : JSON.stringify(data) });
    for (const cookie of response.headers.getSetCookie()) {
      const [key, ...value] = cookie.split(';')[0].split('=');
      cookies.set(key, value.join('='));
      if (key === 'XSRF-TOKEN') csrf = decodeURIComponent(value.join('='));
    }
    return { status: response.status, data: response.status === 204 ? null : await response.json(), response };
  };
  return { request, csrf: () => request('/api/auth/csrf') };
};

test('authentication persists accounts and sessions and enforces permissions', async () => {
  seed(['bin/setup.php']);
  const reader = client();
  assert.equal((await reader.csrf()).status, 204);
  assert.equal((await reader.request('/api/auth/me')).status, 401);
  const registration = { fullName: 'Test Reader', studentId: '202600001', email: 'reader@example.test', grade: '7', role: 'student', password: 'StrongPassword123!', password_confirmation: 'StrongPassword123!' };
  assert.equal((await reader.request('/api/auth/register', registration, { skipCsrf: true })).status, 419);
  assert.equal((await reader.request('/api/auth/register', { ...registration, password: 'a'.repeat(72) + '1', password_confirmation: 'a'.repeat(72) + '1' })).status, 422);
  assert.equal((await reader.request('/api/auth/register', { ...registration, password: 'é'.repeat(36) + 'a1', password_confirmation: 'é'.repeat(36) + 'a1' })).status, 422);
  assert.equal((await reader.request('/api/auth/register', registration)).status, 201);
  assert.equal((await reader.request('/api/auth/register', registration)).status, 422);
  assert.equal((await reader.request('/api/auth/login', { username: '202600001', password: 'incorrect' })).status, 422);
  const signedIn = await reader.request('/api/auth/login', { username: '202600001', password: 'StrongPassword123!', role: 'librarian' });
  assert.equal(signedIn.status, 200);
  assert.equal(signedIn.data.user.role, 'student');
  assert.equal(signedIn.data.user.password, undefined);
  assert.equal((await reader.request('/api/auth/me')).data.user.name, 'Test Reader');
  assert.equal((await reader.request('/api/admin/users')).status, 403);
  assert.equal((await reader.request('/api/auth/logout', {})).status, 204);
  assert.equal((await reader.request('/api/auth/me')).status, 401);

  const staff = client();
  await staff.csrf();
  const pending = await staff.request('/api/auth/register', { ...registration, email: 'teacher@example.test', role: 'teacher', studentId: '', is_active: true });
  assert.equal(pending.status, 201);
  assert.equal(pending.data.user.is_active, false);
  assert.equal((await staff.request('/api/auth/login', { username: 'teacher@example.test', password: 'StrongPassword123!' })).status, 422);
  seed(['bin/create-librarian.php', 'librarian', 'library@example.test', 'Test Librarian'], 'LibrarianPassword123!\n');
  const librarian = client();
  await librarian.csrf();
  assert.equal((await librarian.request('/api/auth/login', { username: 'librarian', password: 'LibrarianPassword123!' })).status, 200);
  assert.equal((await librarian.request('/api/admin/users')).data.users.length, 1);
  assert.equal((await librarian.request(`/api/admin/users/${pending.data.user.id}/approve`, {})).status, 200);
  assert.equal((await staff.request('/api/auth/login', { username: 'teacher@example.test', password: 'StrongPassword123!' })).status, 200);
});

test('password reset tokens are single-use and revoke the previous session', async () => {
  const reader = client();
  await reader.csrf();
  await reader.request('/api/auth/login', { username: '202600001', password: 'StrongPassword123!' });
  const known = await reader.request('/api/auth/forgot-password', { email: 'reader@example.test' });
  const unknown = await reader.request('/api/auth/forgot-password', { email: 'unknown@example.test' });
  assert.deepEqual(known.data, unknown.data);
  const { readFile } = await import('node:fs/promises');
  const mail = await readFile(join(temporary, 'mail.log'), 'utf8');
  const token = new URL(mail.trim().split('\n').at(-1)).searchParams.get('reset_token');
  assert.ok(token);
  const reset = { email: 'reader@example.test', token, password: 'UpdatedPassword123!', password_confirmation: 'UpdatedPassword123!' };
  assert.equal((await reader.request('/api/auth/reset-password', { ...reset, token: 'invalid' })).status, 422);
  assert.equal((await reader.request('/api/auth/reset-password', reset)).status, 200);
  assert.equal((await reader.request('/api/auth/me')).status, 401);
  assert.equal((await reader.request('/api/auth/reset-password', reset)).status, 422);
});

test('repeated invalid logins are rate limited', async () => {
  const attacker = client();
  await attacker.csrf();
  for (let attempt = 0; attempt < 5; attempt++) {
    assert.equal((await attacker.request('/api/auth/login', { username: 'unknown', password: 'wrong' })).status, 422);
  }
  assert.equal((await attacker.request('/api/auth/login', { username: 'unknown', password: 'wrong' })).status, 429);
});
