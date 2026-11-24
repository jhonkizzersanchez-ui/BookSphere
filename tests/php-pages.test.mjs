import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { startBookSphere } from './support.mjs';

let app, base, browser, page, assertRedirect, postForms, signIn, seed, reader;
before(async () => {
  app = await startBookSphere('booksphere-pages-');
  ({ base, browser, page, assertRedirect, postForms, signIn, seed } = app);
  reader = browser();
});
after(() => app?.stop());

const password = 'StrongPassword123!';
const student = { role: 'student', fullName: 'Quinlan Reader', studentId: '202600001', email: 'reader@example.test', grade: '7', classCode: '', staffId: '', password, confirmPassword: password };
const teacher = { role: 'teacher', fullName: 'Tessaly Teacher', studentId: '', email: 'teacher@example.test', grade: '', classCode: '', staffId: '', password, confirmPassword: password };

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
