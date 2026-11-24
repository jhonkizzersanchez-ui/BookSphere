import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { backend, php } from '../scripts/php.mjs';
import { startBookSphere } from './support.mjs';

let app;
before(async () => { app = await startBookSphere('booksphere-admin-'); });
after(() => app?.stop());

const password = 'StrongPassword123!';
const teacher = { role: 'teacher', fullName: 'Dormant Teacher', studentId: '', email: 'dormant@example.test', grade: '', classCode: '', staffId: '', password, confirmPassword: password };

test('setup adds the deactivated_at column to an existing database without losing accounts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'booksphere-upgrade-'));
  try {
    const path = join(directory, 'old.sqlite');
    const env = { ...app.environment, BOOKSPHERE_SQLITE_PATH: path, BOOKSPHERE_STORAGE: directory };
    const run = (args, input) => {
      const result = spawnSync(php, args, { cwd: backend, env, input, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr || result.stdout);
      return result.stdout;
    };
    run(['-r', `$pdo = new PDO('sqlite:' . getenv('BOOKSPHERE_SQLITE_PATH'));
      $pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, login_id TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT "student",
        is_active INTEGER NOT NULL DEFAULT 0, grade TEXT, class_code TEXT, staff_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)');
      $pdo->exec("INSERT INTO users (name, login_id, email, password, role, is_active) VALUES ('Old User', 'old', 'old@example.test', 'x', 'teacher', 1)");`]);
    run(['bin/setup.php']);
    run(['bin/setup.php']);
    const output = run(['-r', `$pdo = new PDO('sqlite:' . getenv('BOOKSPHERE_SQLITE_PATH'));
      $columns = array_column($pdo->query('PRAGMA table_info(users)')->fetchAll(PDO::FETCH_ASSOC), 'name');
      $row = $pdo->query('SELECT name, is_active FROM users')->fetchAll(PDO::FETCH_ASSOC);
      echo json_encode(['columns' => $columns, 'rows' => $row]);`]);
    const { columns, rows } = JSON.parse(output);
    assert.equal(columns.filter(name => name === 'deactivated_at').length, 1);
    assert.deepEqual(rows, [{ name: 'Old User', is_active: 1 }]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('librarians only see and approve pending accounts', async () => {
  const staff = app.browser();
  await app.page(staff, '/register?role=teacher');
  app.assertRedirect(await staff.post('/register', teacher), '/register?role=teacher&done=1');
  app.php(`sql('UPDATE users SET deactivated_at = CURRENT_TIMESTAMP WHERE email = ?', ['${teacher.email}']);`);
  const id = Number(app.php(`echo sql('SELECT id FROM users WHERE email = ?', ['${teacher.email}'])->fetch()['id'];`));

  app.seed(['bin/create-librarian.php', 'librarian', 'library@example.test', 'Test Librarian'], 'LibrarianPassword123!\n');
  const librarian = app.browser();
  app.assertRedirect(await app.signIn(librarian, 'librarian', 'librarian', 'LibrarianPassword123!'), '/dashboard');
  const accounts = await app.page(librarian, '/dashboard?section=accounts');
  assert.ok(!accounts.html.includes(teacher.fullName), 'a deactivated account is not pending');

  app.assertRedirect(await librarian.post(`/librarian/accounts/${id}/approve`), '/dashboard?section=accounts');
  await app.page(librarian, '/dashboard?section=accounts', 'Only pending accounts can be approved.');
  assert.equal(app.php(`echo sql('SELECT is_active FROM users WHERE id = ?', [${id}])->fetch()['is_active'];`), '0');
});

const adminPassword = 'AdminPassword123!';
const createAdmin = () => app.seed(['bin/create-admin.php', 'admin', 'admin@example.test', 'Ada Admin'], adminPassword + '\n');

test('the create-admin command creates an admin who lands on the admin dashboard', async () => {
  createAdmin();
  const admin = app.browser();
  app.assertRedirect(await app.signIn(admin, 'admin', 'admin', adminPassword), '/dashboard');
  await app.page(admin, '/dashboard', 'User Management', 'Ada Admin', 'Admin');
  await app.page(admin, '/catalog');
  await app.page(admin, '/search?q=giver');
  app.assertRedirect(await admin.get('/my-books'), '/dashboard');
});

test('create-admin rejects a duplicate login', () => {
  const result = spawnSync(php, ['bin/create-admin.php', 'admin', 'admin@example.test', 'Ada Admin'], { cwd: backend, env: app.environment, input: adminPassword + '\n', encoding: 'utf8' });
  assert.notEqual(result.status, 0);
});

test('the login page offers an administrator sign-in', async () => {
  const guest = app.browser();
  await app.page(guest, '/login', 'Administrator sign-in');
  await app.page(guest, '/login?role=admin', 'name="role" value="admin"', 'Not an admin? Choose your role');
});

test('admin cannot be chosen at sign-up', async () => {
  const guest = app.browser();
  await app.page(guest, '/register?role=student');
  app.assertRedirect(await guest.post('/register', { role: 'admin', fullName: 'Sneaky Student', studentId: 'sneaky1', email: 'sneaky@example.test', grade: 'Grade 6', classCode: '', staffId: '', password, confirmPassword: password }), '/register?role=student&done=1');
  assert.equal(app.php(`echo sql('SELECT role FROM users WHERE email = ?', ['sneaky@example.test'])->fetch()['role'];`), 'student');
});

test('admins see no role-specific book actions', async () => {
  const admin = app.browser();
  app.assertRedirect(await app.signIn(admin, 'admin', 'admin', adminPassword), '/dashboard');
  const book = await app.page(admin, '/books/b1');
  for (const text of ['Borrow Book', 'Add to Class Reading List', 'Edit Book Record']) assert.ok(!book.html.includes(text), text);
});

const rowCount = html => (html.match(/data-user-row="/g) ?? []).length;
// One shared admin session: sign-in is rate limited to 5 attempts per minute per login.
let sharedAdmin;
const adminBrowser = async () => {
  if (!sharedAdmin) {
    sharedAdmin = app.browser();
    app.assertRedirect(await app.signIn(sharedAdmin, 'admin', 'admin', adminPassword), '/dashboard');
  }
  return sharedAdmin;
};

test('the admin dashboard counts and pages through every account', async () => {
  app.php(`$hash = hashPassword('x');
    for ($i = 1; $i <= 55; $i++) {
      $n = sprintf('%03d', $i);
      sql('INSERT INTO users (name, login_id, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, 1)', ['Bulk Student '.$n, 'bulk'.$n, 'bulk'.$n.'@example.test', $hash, 'student']);
    }`);
  const total = Number(app.php("echo userCounts()['total'];"));
  assert.ok(total > 55);
  const admin = await adminBrowser();
  const first = await app.page(admin, '/dashboard', 'Total accounts', 'Pending approval', 'Deactivated');
  assert.equal(rowCount(first.html), 50);
  assert.ok(first.html.includes(`Showing 1–50 of ${total}`));
  assert.ok(first.html.includes('Next') && !first.html.includes('Previous'));
  const second = await app.page(admin, '/dashboard?page=2');
  assert.equal(rowCount(second.html), total - 50);
  assert.equal((await app.page(admin, '/dashboard?page=999')).html, second.html);
  for (const page of ['0', '-3', 'abc']) assert.equal(rowCount((await app.page(admin, `/dashboard?page=${page}`)).html), 50);
});

test('the admin directory searches and filters', async () => {
  const guest = app.browser();
  for (const [role, name, id, email] of [['teacher', 'Tessaly Teacher', '', 'tessaly@example.test'], ['teacher', 'Pending Pat', '', 'pat@example.test']]) {
    await app.page(guest, `/register?role=${role}`);
    app.assertRedirect(await guest.post('/register', { role, fullName: name, studentId: id, email, grade: '', classCode: '', staffId: '', password, confirmPassword: password }), `/register?role=${role}&done=1`);
  }
  app.php(`sql('UPDATE users SET is_active = 1 WHERE email = ?', ['tessaly@example.test']);`);
  const admin = await adminBrowser();
  const none = 'No accounts match these filters.';
  const search = await app.page(admin, '/dashboard?q=tessaly', 'Tessaly Teacher');
  assert.equal(rowCount(search.html), 1);
  const pending = await app.page(admin, '/dashboard?role=teacher&status=pending', 'Pending Pat');
  assert.ok(!pending.html.includes('Tessaly Teacher'));
  assert.ok(rowCount(pending.html) >= 1);
  const unfiltered = await app.page(admin, '/dashboard');
  assert.equal(rowCount((await app.page(admin, '/dashboard?role=root&status=x')).html), rowCount(unfiltered.html));
  for (const q of ['%25', '_']) assert.ok((await app.page(admin, `/dashboard?q=${q}`)).html.includes(none), q);
  await app.page(admin, '/dashboard?q=O%27Brien', none);
});

test('the admin directory escapes account names', async () => {
  app.php(`sql('INSERT INTO users (name, login_id, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, 1)', ['<b>Bold</b> "Quote"', 'xssuser', 'xss@example.test', hashPassword('x'), 'student']);`);
  const admin = await adminBrowser();
  const html = (await app.page(admin, '/dashboard?q=xssuser', '&lt;b&gt;Bold&lt;/b&gt; &quot;Quote&quot;')).html;
  assert.ok(!html.includes('<b>Bold</b>'));
});

/* ---------- Admin account actions ---------- */

let accountNumber = 0;
/** Creates an account directly in the database and returns its details. */
const makeAccount = (name, role, { active = true, deactivated = false } = {}) => {
  const n = ++accountNumber;
  const account = { name, email: `action${n}@example.test`, login: `action${n}` };
  const values = JSON.stringify([name, account.login, account.email, role, active ? 1 : 0]);
  account.id = Number(app.php(`[$name, $login, $email, $role, $active] = json_decode(${JSON.stringify(values)}, true);
    sql('INSERT INTO users (name, login_id, email, password, role, is_active, deactivated_at) VALUES (?, ?, ?, ?, ?, ?, ${deactivated ? 'CURRENT_TIMESTAMP' : 'NULL'})',
      [$name, $login, $email, hashPassword(${JSON.stringify(password)}), $role, $active]);
    echo database()->lastInsertId();`));
  return account;
};
const adminId = () => Number(app.php(`echo sql("SELECT id FROM users WHERE login_id = 'admin'")->fetch()['id'];`));
const act = (agent, id, action, fields = {}) => agent.post(`/admin/users/${id}/${action}`, fields);
const dbValue = (id, column) => app.php(`echo sql('SELECT ${column} FROM users WHERE id = ?', [${id}])->fetch()['${column}'];`);
const signInAs = (account, role) => app.signIn(app.browser(), role, account.email, password);
/** An admin browser holding a fresh CSRF token. */
const readyAdmin = async () => {
  const admin = await adminBrowser();
  await app.page(admin, '/dashboard');
  return admin;
};

test('deactivation signs the user out and reactivation restores access', async () => {
  const user = makeAccount('Tess Deactivate', 'teacher');
  const browser = app.browser();
  app.assertRedirect(await app.signIn(browser, 'teacher', user.email, password), '/dashboard');
  await app.page(browser, '/dashboard');

  const admin = await readyAdmin();
  app.assertRedirect(await act(admin, user.id, 'deactivate', { return: 'q=tess&evil=1' }), '/dashboard?q=tess');
  const listing = await app.page(admin, '/dashboard?q=tess+deactivate', 'Tess Deactivate deactivated.');
  const row = listing.html.match(new RegExp(`<tr data-user-row="${user.id}"[\\s\\S]*?</tr>`))[0];
  assert.ok(row.includes('Deactivated') && row.includes('Reactivate'));

  app.assertRedirect(await browser.get('/dashboard'), '/login');
  assert.equal((await signInAs(user, 'teacher')).status, 200, 'sign-in is refused');

  app.assertRedirect(await act(admin, user.id, 'reactivate', { return: '' }), '/dashboard');
  await app.page(admin, '/dashboard', 'Tess Deactivate reactivated.');
  app.assertRedirect(await signInAs(user, 'teacher'), '/dashboard');
  app.assertRedirect(await browser.get('/dashboard'), '/login');
});

test('a pending account cannot be made an admin', async () => {
  const user = makeAccount('Pending Paula', 'teacher', { active: false });
  const admin = await readyAdmin();
  app.assertRedirect(await act(admin, user.id, 'role', { role: 'admin' }), '/dashboard');
  await app.page(admin, '/dashboard', 'Approve this account before making it an admin.');
  assert.equal(dbValue(user.id, 'role'), 'teacher');
  assert.equal(dbValue(user.id, 'is_active'), '0');
});

test('admins approve pending accounts', async () => {
  const user = makeAccount('Penny Pending', 'teacher', { active: false });
  const admin = await readyAdmin();
  await app.page(admin, '/dashboard?status=pending', `/admin/users/${user.id}/approve`);
  app.assertRedirect(await act(admin, user.id, 'approve', { return: 'status=pending' }), '/dashboard?status=pending');
  await app.page(admin, '/dashboard', 'Penny Pending approved.');
  app.assertRedirect(await signInAs(user, 'teacher'), '/dashboard');
});

test('role changes apply on the next request', async () => {
  const user = makeAccount('Quinlan Reader', 'student');
  const browser = app.browser();
  app.assertRedirect(await app.signIn(browser, 'student', user.email, password), '/dashboard');
  assert.ok(!(await app.page(browser, '/dashboard')).html.includes('Library Dashboard'));
  const admin = await readyAdmin();
  app.assertRedirect(await act(admin, user.id, 'role', { role: 'librarian' }), '/dashboard');
  await app.page(admin, '/dashboard', 'Quinlan Reader is now Librarian.');
  await app.page(browser, '/dashboard', 'Library Dashboard');
});

test('admins can send a reset link', async () => {
  const user = makeAccount('Reset Rita', 'student');
  const admin = await readyAdmin();
  app.assertRedirect(await act(admin, user.id, 'reset-link'), '/dashboard');
  await app.page(admin, '/dashboard', `Password reset link requested for ${user.email}.`);
  const log = await readFile(join(app.temporary, 'mail.log'), 'utf8');
  assert.ok(log.includes(encodeURIComponent(user.email)));
});

test('admins cannot lock themselves out', async () => {
  const admin = await readyAdmin();
  const id = adminId();
  app.assertRedirect(await act(admin, id, 'deactivate'), '/dashboard');
  await app.page(admin, '/dashboard', 'You cannot deactivate your own account.');
  app.assertRedirect(await act(admin, id, 'role', { role: 'student' }), '/dashboard');
  const html = (await app.page(admin, '/dashboard?q=admin%40example.test', 'You cannot change your own role.')).html;
  const own = html.match(new RegExp(`<tr data-user-row="${id}"[\\s\\S]*?</tr>`))[0];
  assert.ok(!own.includes('Deactivate') && !own.includes('Save role'));
  assert.ok(own.includes('Send reset link'));
  assert.equal(dbValue(id, 'role'), 'admin');
});

test('the last active admin cannot be removed', () => {
  const id = adminId();
  const run = call => app.php(`try { ${call}; echo 'no error'; } catch (ApiException $e) { echo $e->getMessage(); }`);
  assert.equal(run(`changeAccountRole(['id' => 0], ${id}, 'student')`), 'At least one active admin is required.');
  assert.equal(run(`deactivateAccount(['id' => 0], ${id})`), 'At least one active admin is required.');
  assert.equal(dbValue(id, 'role'), 'admin');
  assert.equal(dbValue(id, 'is_active'), '1');
  // With a second active admin the first can be demoted, which makes the second the last one.
  const second = makeAccount('Second Admin', 'admin');
  assert.equal(run(`changeAccountRole(['id' => 0], ${id}, 'student')`), 'no error');
  assert.equal(run(`deactivateAccount(['id' => 0], ${second.id})`), 'At least one active admin is required.');
  app.php(`changeAccountRole(['id' => 0], ${id}, 'admin');`);
  assert.equal(dbValue(id, 'role'), 'admin');
});

test('invalid admin actions change nothing', async () => {
  const user = makeAccount('Stable Sam', 'student');
  const admin = await readyAdmin();
  const expectToast = async (response, message) => {
    assert.equal(response.status, 303, `${response.path} returned ${response.status}`);
    await app.page(admin, '/dashboard', message);
  };
  await expectToast(await act(admin, user.id, 'role', { role: 'root' }), 'Select a valid role.');
  await expectToast(await act(admin, 999999, 'deactivate'), 'Account not found.');
  await expectToast(await act(admin, 999999, 'role', { role: 'student' }), 'Account not found.');
  await expectToast(await act(admin, 999999, 'reset-link'), 'Account not found.');
  await expectToast(await act(admin, user.id, 'reactivate'), 'Only deactivated accounts can be reactivated.');
  await expectToast(await act(admin, user.id, 'approve'), 'Only pending accounts can be approved.');
  assert.equal((await act(admin, user.id, 'explode')).status, 404);
  assert.equal(dbValue(user.id, 'role'), 'student');
  assert.equal(dbValue(user.id, 'is_active'), '1');
  await act(admin, user.id, 'deactivate');
  await expectToast(await act(admin, user.id, 'deactivate'), 'This account is already deactivated.');
});

test('only admins can use admin actions', async () => {
  const user = makeAccount('Safe Sally', 'student');
  const librarian = app.browser();
  app.assertRedirect(await app.signIn(librarian, 'librarian', 'librarian', 'LibrarianPassword123!'), '/dashboard');
  await app.page(librarian, '/dashboard');
  for (const action of ['deactivate', 'role', 'reset-link', 'approve']) {
    app.assertRedirect(await act(librarian, user.id, action, { role: 'admin' }), '/dashboard');
    await app.page(librarian, '/dashboard', 'Admin access is required.');
  }
  assert.equal(dbValue(user.id, 'is_active'), '1');
  assert.equal(dbValue(user.id, 'role'), 'student');
});

test('toasts escape account names', async () => {
  const admin = await readyAdmin();
  const id = Number(app.php(`echo sql('SELECT id FROM users WHERE login_id = ?', ['xssuser'])->fetch()['id'];`));
  app.assertRedirect(await act(admin, id, 'deactivate'), '/dashboard');
  const html = (await app.page(admin, '/dashboard', 'deactivated.')).html;
  assert.ok(!html.includes('<b>Bold</b>'));
});

/* ---------- Final-review fixes ---------- */

const rowHtml = (html, id) => html.match(new RegExp(`<tr data-user-row="${id}"[\\s\\S]*?</tr>`))?.[0];

test('one account with a NULL created_at or an unknown role does not break the admin dashboard', async () => {
  const dateless = makeAccount('Dateless Dan', 'student');
  app.php(`sql('UPDATE users SET created_at = NULL WHERE id = ?', [${dateless.id}]);`);
  const odd = makeAccount('Odd Olive', 'staff');
  const admin = await readyAdmin();
  const listing = await app.page(admin, '/dashboard?q=Dateless+Dan', 'Dateless Dan');

  assert.ok(rowHtml(listing.html, dateless.id).includes('—'));
  const unknown = await app.page(admin, '/dashboard?q=Odd+Olive', 'Odd Olive');
  assert.ok(rowHtml(unknown.html, odd.id).includes('Staff'));
});

test('an account with an unknown role is refused the dashboard', async () => {
  const odd = makeAccount('Rogue Role', 'staff');
  const browser = app.browser();
  app.assertRedirect(await app.signIn(browser, 'student', odd.email, password), '/dashboard');
  const response = await browser.get('/dashboard');
  assert.equal(response.status, 403);
  assert.ok(response.html.includes('Account role not recognised'));
  assert.ok(!response.html.includes('Pending accounts') && !response.html.includes('Library Dashboard'));
  assert.ok(!(await browser.get('/dashboard?section=accounts')).html.includes('@example.test'));
});

test('a database without the deactivated_at column asks for the setup command', async () => {
  const old = await startBookSphere('booksphere-nocolumn-');
  try {
    old.seed(['bin/create-admin.php', 'admin', 'admin@example.test', 'Ada Admin'], adminPassword + '\n');
    const browser = old.browser();
    old.assertRedirect(await old.signIn(browser, 'admin', 'admin', adminPassword), '/dashboard');
    await old.page(browser, '/dashboard', 'User Management');

    // The API client signs in before the column disappears.
    const cookies = new Map();
    let csrf;
    const call = async (path, data) => {
      const headers = { Accept: 'application/json', Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; ') };
      if (data !== undefined) { headers['Content-Type'] = 'application/json'; headers['X-XSRF-TOKEN'] = csrf; }
      const response = await fetch(old.base + path, { method: data === undefined ? 'GET' : 'POST', headers, body: data === undefined ? undefined : JSON.stringify(data) });
      for (const cookie of response.headers.getSetCookie()) {
        const [key, ...value] = cookie.split(';')[0].split('=');
        cookies.set(key, value.join('='));
        if (key === 'XSRF-TOKEN') csrf = decodeURIComponent(value.join('='));
      }
      return { status: response.status, body: response.status === 204 ? null : await response.json() };
    };
    await call('/api/auth/csrf');
    assert.equal((await call('/api/auth/login', { username: 'admin', password: adminPassword })).status, 200);

    old.php(`database()->exec('ALTER TABLE users DROP COLUMN deactivated_at');`);
    const page = await browser.get('/dashboard');
    assert.equal(page.status, 500);
    assert.ok(page.html.includes('Database update needed'));
    assert.ok(page.html.includes('Run npm run backend:setup once, then reload this page.'));
    const api = await call('/api/admin/users');
    assert.equal(api.status, 500);
    assert.equal(api.body.message, 'Database update needed: run npm run backend:setup.');
  } finally {
    await old.stop();
  }
});

test('the dashboard can list only deactivated accounts', async () => {
  const gone = makeAccount('Gone Gary', 'teacher', { active: false, deactivated: true });
  makeAccount('Here Hilda', 'teacher');
  const admin = await readyAdmin();
  const html = (await app.page(admin, '/dashboard?status=deactivated', 'Gone Gary')).html;
  assert.ok(!html.includes('Here Hilda'));
  assert.ok(rowCount(html) >= 1);
  for (const [row] of html.matchAll(/<tr data-user-row="[\s\S]*?<\/tr>/g)) assert.ok(row.includes('>Deactivated<'), row.slice(0, 80));
  assert.ok(rowHtml(html, gone.id));
});

test('only active accounts can be made admins from the role menu', async () => {
  const pending = makeAccount('Waiting Wendy', 'teacher', { active: false });
  const active = makeAccount('Ready Rhett', 'teacher');
  const admin = await readyAdmin();
  const options = row => [...row.matchAll(/<option value="([^"]*)"/g)].map(match => match[1]);
  const pendingRow = rowHtml((await app.page(admin, '/dashboard?q=Waiting+Wendy')).html, pending.id);
  const activeRow = rowHtml((await app.page(admin, '/dashboard?q=Ready+Rhett')).html, active.id);
  assert.ok(options(pendingRow).includes('librarian') && !options(pendingRow).includes('admin'));
  assert.ok(options(activeRow).includes('admin'));
});

test('a librarian cannot approve a deactivated account through the API', async () => {
  const gone = makeAccount('Revoked Rex', 'teacher', { active: false, deactivated: true });
  const cookies = new Map();
  let csrf;
  const call = async (path, data) => {
    const headers = { Accept: 'application/json', Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; ') };
    if (data !== undefined) { headers['Content-Type'] = 'application/json'; headers['X-XSRF-TOKEN'] = csrf; }
    const response = await fetch(app.base + path, { method: data === undefined ? 'GET' : 'POST', headers, body: data === undefined ? undefined : JSON.stringify(data) });
    for (const cookie of response.headers.getSetCookie()) {
      const [key, ...value] = cookie.split(';')[0].split('=');
      cookies.set(key, value.join('='));
      if (key === 'XSRF-TOKEN') csrf = decodeURIComponent(value.join('='));
    }
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  };
  await call('/api/auth/csrf');
  assert.equal((await call('/api/auth/login', { username: 'librarian', password: 'LibrarianPassword123!' })).status, 200);
  const result = await call(`/api/admin/users/${gone.id}/approve`, {});
  assert.equal(result.status, 422);
  assert.equal(result.body.message, 'Only pending accounts can be approved.');
  assert.equal(dbValue(gone.id, 'is_active'), '0');
});
