import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { auth, ApiError } from '../src/lib/auth.ts';

const originalFetch = globalThis.fetch;
globalThis.document = { cookie: 'XSRF-TOKEN=encoded%2Btoken%3D' };
afterEach(() => { globalThis.fetch = originalFetch; });

test('login initializes CSRF and sends credentials with the cookie token', async () => {
  const calls = [];
  globalThis.fetch = async (path, options) => {
    calls.push({ path, options });
    return path === '/api/auth/csrf'
      ? new Response(null, { status: 204 })
      : Response.json({ user: { name: 'Reader', role: 'student' } });
  };
  const user = await auth.login('202600001', 'StrongPassword123!');
  assert.equal(user.role, 'student');
  assert.equal(calls[0].path, '/api/auth/csrf');
  assert.equal(calls[1].options.credentials, 'include');
  assert.equal(calls[1].options.headers['X-XSRF-TOKEN'], 'encoded+token=');
  assert.deepEqual(JSON.parse(calls[1].options.body), { username: '202600001', password: 'StrongPassword123!' });
});

test('an unauthorized session returns no current user', async () => {
  globalThis.fetch = async () => Response.json({ message: 'Unauthenticated.' }, { status: 401 });
  assert.equal(await auth.currentUser(), null);
});

test('a backend outage is reported instead of treated as logged out', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(auth.currentUser(), /Unable to reach the PHP backend/);
});

test('registration exposes server validation errors to the form', async () => {
  globalThis.fetch = async (path) => path === '/api/auth/csrf'
    ? new Response(null, { status: 204 })
    : Response.json({ message: 'Validation failed', errors: { email: ['Email is already registered.'] } }, { status: 422 });
  await assert.rejects(auth.register({ email: 'reader@example.test' }), error =>
    error instanceof ApiError && error.status === 422 && error.errors.email[0] === 'Email is already registered.');
});

test('a stale CSRF token produces a recoverable error without repeating the mutation', async () => {
  let requests = 0;
  globalThis.fetch = async (path) => {
    requests++;
    return path === '/api/auth/csrf' ? new Response(null, { status: 204 })
      : Response.json({ message: 'CSRF token mismatch.' }, { status: 419 });
  };
  await assert.rejects(auth.login('reader', 'password'), /session expired/);
  assert.equal(requests, 2);
});
