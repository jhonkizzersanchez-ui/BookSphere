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
  temporary = await mkdtemp(join(tmpdir(), 'booksphere-pages-'));
  environment.BOOKSPHERE_DB_DRIVER = 'sqlite';
  environment.BOOKSPHERE_SQLITE_PATH = join(temporary, 'test.sqlite');
  environment.BOOKSPHERE_STORAGE = temporary;
  environment.BOOKSPHERE_MAIL_TRANSPORT = 'log';
  environment.BOOKSPHERE_BCRYPT_COST = '4';
  seed(['bin/setup.php']);
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

const decode = value => value.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const relative = location => { const url = new URL(location, base); return url.pathname + url.search; };

/** Returns the POST forms on a page as { action, path } (action is resolved against the page URL). */
const postForms = (html, pagePath) => [...html.matchAll(/<form\b[^>]*>/gi)].map(([tag]) => {
  const attribute = name => { const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i')); return match ? decode(match[1]) : undefined; };
  if ((attribute('method') ?? 'get').toLowerCase() !== 'post') return null;
  const action = relative(new URL(attribute('action') ?? pagePath, base + pagePath).href);
  return { action, path: action.split('?')[0] };
}).filter(Boolean);

/** A minimal browser: keeps cookies, does not follow redirects, and remembers the latest _csrf field it saw. */
const browser = () => {
  const cookies = new Map();
  let csrf;
  const send = async (path, form) => {
    const headers = { Accept: 'text/html' };
    if (cookies.size) headers.Cookie = [...cookies].map(([key, value]) => `${key}=${value}`).join('; ');
    let body;
    if (form) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = new URLSearchParams(form).toString();
    }
    const response = await fetch(base + path, { method: form ? 'POST' : 'GET', headers, body, redirect: 'manual' });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair, ...attributes] = cookie.split(';');
      const [key, ...value] = pair.trim().split('=');
      const expired = value.join('=') === 'deleted' || attributes.some(attribute => /^\s*max-age=0\s*$/i.test(attribute));
      if (expired) cookies.delete(key); else cookies.set(key, value.join('='));
    }
    const html = await response.text();
    const token = html.match(/name="_csrf" value="([^"]+)"/)?.[1];
    if (token) csrf = decode(token);
    const location = response.headers.get('location');
    return { path, status: response.status, type: response.headers.get('content-type') ?? '', location: location && relative(location), html };
  };
  return {
    get: path => send(path),
    /** Submits a form with the current CSRF token. Pass _csrf in fields to override it. */
    post: (path, fields = {}) => send(path, { _csrf: csrf ?? '', ...fields }),
    get csrf() { return csrf; },
  };
};

const page = async (agent, path, ...expected) => {
  const response = await agent.get(path);
  assert.equal(response.status, 200, `GET ${path} returned ${response.status}${response.location ? ` -> ${response.location}` : ''}`);
  assert.match(response.type, /^text\/html/);
  for (const text of expected) assert.ok(response.html.includes(text), `GET ${path} should contain ${JSON.stringify(text)}`);
  return response;
};
const assertRedirect = (response, target) => {
  assert.equal(response.status, 303, `${response.path} should redirect to ${target} (got ${response.status})`);
  assert.equal(response.location, target);
};
const signIn = async (agent, role, username, password) => {
  await page(agent, `/login?role=${role}`);
  assert.ok(agent.csrf, 'the login page should include a _csrf field');
  return agent.post('/login', { role, username, password });
};

const password = 'StrongPassword123!';
const student = { role: 'student', fullName: 'Quinlan Reader', studentId: '202600001', email: 'reader@example.test', grade: '7', classCode: '', staffId: '', password, confirmPassword: password };
const teacher = { role: 'teacher', fullName: 'Tessaly Teacher', studentId: '', email: 'teacher@example.test', grade: '', classCode: '', staffId: '', password, confirmPassword: password };
const reader = browser();

test('signed-out visitors are sent to the login page', async () => {
  const visitor = browser();
  assertRedirect(await visitor.get('/'), '/login');
  assertRedirect(await visitor.get('/catalog'), '/login');
  assertRedirect(await visitor.get('/dashboard'), '/login');
});

test('the login page renders a sign-in form', async () => {
  const visitor = browser();
  const login = await page(visitor, '/login', 'name="username"', 'name="password"');
  assert.ok(postForms(login.html, '/login').some(form => form.path === '/login'), 'the login page should have a form that posts to /login');
  assert.ok(visitor.csrf, 'the login form should include a _csrf field');
});

test('static assets are served by the PHP router', async () => {
  const response = await fetch(base + '/assets/app.js');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /javascript/);
});

test('students can register through the sign-up form', async () => {
  await page(reader, '/register?role=student');
  assert.ok(reader.csrf, 'the sign-up page should include a _csrf field');
  assertRedirect(await reader.post('/register', student), '/register?role=student&done=1');
  await page(reader, '/register?role=student&done=1', 'Account created!');
});

test('form posts without a valid CSRF token do not sign in', async () => {
  const visitor = browser();
  await page(visitor, '/login?role=student');
  const credentials = { role: 'student', username: student.studentId, password };
  // The redirect keeps the selected role so the user does not have to pick it again.
  assertRedirect(await visitor.post('/login', { ...credentials, _csrf: 'invalid' }), '/login?role=student');
  assertRedirect(await visitor.post('/login', { ...credentials, _csrf: '' }), '/login?role=student');
  await page(visitor, '/login', 'Your session expired. Please try again.');
  assertRedirect(await visitor.get('/dashboard'), '/login');
});

test('a wrong password re-renders the login page with the server error', async () => {
  const visitor = browser();
  const response = await signIn(visitor, 'student', student.studentId, 'IncorrectPassword123');
  assert.equal(response.status, 200, `a failed sign-in should re-render the form, not redirect to ${response.location}`);
  assert.ok(response.html.includes('Unable to sign in. Check your credentials'), 'the server error message should be shown');
  assert.ok(postForms(response.html, '/login').some(form => form.path === '/login'));
  assertRedirect(await visitor.get('/dashboard'), '/login');
});

test('signed-in students can open the app pages', async () => {
  assertRedirect(await signIn(reader, 'student', student.studentId, password), '/dashboard');
  await page(reader, '/dashboard', 'Quinlan');
  await page(reader, '/catalog');
  await page(reader, '/search?q=giver', 'The Giver');
  await page(reader, '/books/b1', 'The Giver');
  await page(reader, '/my-books');
  assertRedirect(await reader.get('/'), '/dashboard');
});

test('search terms are HTML-escaped', async () => {
  const term = '<script>x</script>';
  const response = await page(reader, `/search?q=${encodeURIComponent(term)}`);
  assert.ok(!response.html.includes(term), 'the raw search term must not appear in the page');
  assert.ok(response.html.includes('&lt;script&gt;x&lt;/script&gt;'), 'the escaped search term should be shown');
});

test('staff accounts wait for librarian approval', async () => {
  const staff = browser();
  await page(staff, '/register?role=teacher');
  assertRedirect(await staff.post('/register', teacher), '/register?role=teacher&done=1');
  await page(staff, '/register?role=teacher&done=1', 'Account created!');
  const pending = await signIn(staff, 'teacher', teacher.email, password);
  assert.equal(pending.status, 200, 'a pending teacher should not be signed in');
  assert.ok(pending.html.includes('Unable to sign in'));

  seed(['bin/create-librarian.php', 'librarian', 'library@example.test', 'Test Librarian'], 'LibrarianPassword123!\n');
  const librarian = browser();
  assertRedirect(await signIn(librarian, 'librarian', 'librarian', 'LibrarianPassword123!'), '/dashboard');
  const accounts = await page(librarian, '/dashboard?section=accounts', teacher.fullName);
  const approvals = postForms(accounts.html, '/dashboard?section=accounts').filter(form => /^\/librarian\/accounts\/\d+\/approve$/.test(form.path));
  assert.equal(approvals.length, 1, 'exactly one pending account should have an approve form');
  assertRedirect(await librarian.post(approvals[0].action), '/dashboard?section=accounts');
  const approved = await page(librarian, '/dashboard?section=accounts', `${teacher.fullName} approved.`);
  assert.equal(postForms(approved.html, '/dashboard?section=accounts').filter(form => /^\/librarian\/accounts\/\d+\/approve$/.test(form.path)).length, 0);

  assertRedirect(await signIn(staff, 'teacher', teacher.email, password), '/dashboard');
  await page(staff, '/dashboard', 'Tessaly');
  assertRedirect(await staff.get('/my-books'), '/dashboard');
});

test('signing out ends the session', async () => {
  await page(reader, '/dashboard');
  assertRedirect(await reader.post('/logout'), '/login');
  assertRedirect(await reader.get('/dashboard'), '/login');
  assertRedirect(await reader.get('/'), '/login');
});
