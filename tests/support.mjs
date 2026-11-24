import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { backend, php } from '../scripts/php.mjs';

const decode = value => value.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** Starts an isolated BookSphere (SQLite database, PHP built-in server) and returns helpers bound to it. */
export async function startBookSphere(prefix) {
  const temporary = await mkdtemp(join(tmpdir(), prefix));
  const environment = {
    ...process.env,
    BOOKSPHERE_DB_DRIVER: 'sqlite',
    BOOKSPHERE_SQLITE_PATH: join(temporary, 'test.sqlite'),
    BOOKSPHERE_STORAGE: temporary,
    BOOKSPHERE_MAIL_TRANSPORT: 'log',
    BOOKSPHERE_BCRYPT_COST: '4',
  };
  const seed = (args, input) => {
    const result = spawnSync(php, args, { cwd: backend, env: environment, input, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  };
  /** Runs PHP code after loading the app's bootstrap, auth and (when present) admin files. */
  const runPhp = code => {
    const files = ['src/bootstrap.php', 'src/auth.php', 'src/admin.php'];
    const prelude = files.map(file => `if (is_file(${JSON.stringify(join(backend, file))})) require_once ${JSON.stringify(join(backend, file))};`).join(' ');
    const result = spawnSync(php, ['-r', `${prelude} ${code}`], { cwd: backend, env: environment, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    return result.stdout;
  };

  let server;
  const stop = async () => {
    if (server && server.exitCode === null) {
      const exited = new Promise(resolve => server.once('exit', resolve));
      server.kill();
      await exited;
    }
    await rm(temporary, { recursive: true, force: true });
  };

  try {
    seed(['bin/setup.php']);
    const probe = createServer();
    await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
    const port = probe.address().port;
    await new Promise(resolve => probe.close(resolve));
    var base = `http://127.0.0.1:${port}`;
    server = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', 'public', 'public/router.php'], { cwd: backend, env: environment, stdio: 'ignore' });
    let started = false;
    for (let attempt = 0; attempt < 50 && !started; attempt++) {
      try { await fetch(base + '/api/health'); started = true; } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    if (!started) throw new Error('PHP test server did not start.');
  } catch (error) {
    await stop();
    throw error;
  }

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

  return { base, temporary, environment, seed, php: runPhp, browser, page, assertRedirect, postForms, signIn, stop };
}
