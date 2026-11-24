# Admin Role Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a separate `admin` role whose dashboard lists and manages every account (approve, deactivate, reactivate, change role, send reset link) with lock-out protection.

**Architecture:** Server-rendered PHP, same structure as the rest of the app: data functions in `backend/src/`, routes in `backend/src/pages.php`, templates in `backend/views/`, behaviour via data attributes in `backend/public/assets/app.js`. A new nullable `users.deactivated_at` column separates *pending* from *deactivated*. Admins land on `/dashboard`, like every other role.

**Tech Stack:** PHP 8.1+ (XAMPP PHP 8.3) with PDO (MySQL/MariaDB live, SQLite in tests), Tailwind v4 browser CDN, vanilla JS, Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-11-24-admin-role-design.md`

## Global Constraints

- Roles are exactly `student`, `teacher`, `librarian`, `admin`. Sign-up accepts only the first three.
- Admin presentation: label `Admin`, emoji `🛡️`, accent colour `#264653`, background `#E8EDF0`, description `Manage every account`.
- Status values: `active` (`is_active = 1`), `pending` (`is_active = 0 AND deactivated_at IS NULL`), `deactivated` (`is_active = 0 AND deactivated_at IS NOT NULL`).
- The directory shows 50 accounts per page.
- Every SQL statement must work on both MySQL/MariaDB and SQLite, with prepared statements only.
- Every dynamic value in HTML goes through `e()`, and every POST form includes `csrfField()`.
- No new Composer or npm dependencies. Run PHP through `scripts/php.mjs` (`C:/xampp/php/php.exe`).
- Run the tests with `npm test` (all `tests/*.test.mjs`). All existing tests must keep passing.
- **Do not commit.** The user has not asked for commits. Leave changes in the working tree.

## Review Focus

1. **Upgrading an existing MySQL database:** `npm run backend:setup` must add `deactivated_at` without touching existing accounts, and running it twice must be harmless. Tests cover SQLite only. Task 1 pins SQLite idempotency, and the user checks MySQL by hand after the build.
2. **Search text with LIKE wildcards or quotes** (`%`, `_`, `'`) must match literally and never raise a SQL error. Task 3 pins this.
3. **Tampered values** must fall back safely, never return a 500 error, and never change anything:
   - query values such as `page=0`, `page=-3`, `page=999`, `page=abc`, `role=root` and `status=x`;
   - form values such as an unknown user id or `role=root`.

   Tasks 3 and 4 pin these.
4. **A user deactivated or re-roled mid-session** sees the change on their very next request: signed out, or the new role's dashboard. Task 4 pins this.
5. **Names or emails containing HTML or quotes** are escaped in the directory, in confirm prompts and in flash toasts. Tasks 3 and 4 pin this.

---

### Task 1: Pending vs deactivated status, schema upgrade, shared test harness

**Files:**
- Modify: `backend/schema.sql` (add `deactivated_at TIMESTAMP NULL DEFAULT NULL` after `is_active`)
- Modify: `backend/src/bootstrap.php` (`installSchema()` plus a new column upgrade)
- Modify: `backend/src/auth.php` (`pendingAccounts()`, `approveAccount()`, new `accountStatus()`)
- Create: `tests/support.mjs` (harness extracted from `tests/php-pages.test.mjs`)
- Modify: `tests/php-pages.test.mjs` (use the harness; keep all 10 tests unchanged in behaviour)
- Create: `tests/php-admin.test.mjs`
- Modify: `backend/README.md`, `ONBOARDING.md` (one line each: run `npm run backend:setup` once after updating, to add the new column)

**Interfaces:**
- Produces (PHP):
  - `accountStatus(array $user): string` returns `'active' | 'pending' | 'deactivated'`.
  - `pendingAccounts(): array` returns pending users only.
  - `approveAccount(int $id): array` returns the updated row. It throws `ApiException('Account not found.', 404)` or `ApiException('Only pending accounts can be approved.', 422)`.
  - `upgradeSchema(): void` is called at the end of `installSchema()`.
- Produces (JS) `tests/support.mjs`: `export async function startBookSphere(prefix: string)`, which returns an `app` object with:
  - `base`, `temporary`
  - `seed(args, input?)` runs PHP in `backend/` and asserts exit 0
  - `php(code: string): string` runs `php -r` after requiring every existing file of `src/bootstrap.php`, `src/auth.php`, `src/admin.php`, and returns stdout (asserts exit 0)
  - `browser()`, `page(agent, path, ...expected)`, `assertRedirect(response, target)`, `postForms(html, pagePath)`, `signIn(agent, role, username, password)`, `stop()`

  These keep the exact behaviour of the helpers now inlined in `tests/php-pages.test.mjs`, bound to this server's `base`.

- [ ] **Step 1: Extract the harness.** Move the server start/stop and helper code from `tests/php-pages.test.mjs` into `tests/support.mjs` as `startBookSphere`. In `php-pages.test.mjs`, call it in `before` and `app.stop()` in `after`. Run `npm test`. Expected: 14 pass, 0 fail.

- [ ] **Step 2: Write the failing tests** in `tests/php-admin.test.mjs` (its own `startBookSphere('booksphere-admin-')`):
  - `setup adds the deactivated_at column to an existing database without losing accounts`:
    1. Point a fresh SQLite path at a users table created with the *old* columns (no `deactivated_at`) and insert one row.
    2. Run `bin/setup.php` twice with that path. Both runs exit 0.
    3. Assert via `PRAGMA table_info(users)` that `deactivated_at` exists exactly once, and that the row is still there with its `is_active` unchanged.

    Use `spawnSync` with an env override of `BOOKSPHERE_SQLITE_PATH`.
  - `librarians only see and approve pending accounts`:
    1. Register a teacher.
    2. Mark them deactivated via `app.php("sql('UPDATE users SET deactivated_at = CURRENT_TIMESTAMP WHERE email = ?', ['…']);")`.
    3. Sign in as a librarian created with `bin/create-librarian.php`.
    4. Assert `/dashboard?section=accounts` does not contain the teacher's name.
    5. POST `/librarian/accounts/{id}/approve`. Expect a redirect to `/dashboard?section=accounts` whose page contains `Only pending accounts can be approved.`.
    6. Assert `is_active` is still 0 via `app.php`.

- [ ] **Step 3: Run `npm test`.** Expected: the two new tests FAIL (no column; the deactivated teacher is listed and approved).

- [ ] **Step 4: Implement.**
  - `upgradeSchema()`:
    - MySQL: count `information_schema.COLUMNS` where `TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'deactivated_at'`; if 0, run `ALTER TABLE users ADD COLUMN deactivated_at TIMESTAMP NULL DEFAULT NULL AFTER is_active`.
    - SQLite: check `PRAGMA table_info(users)`; if missing, run `ALTER TABLE users ADD COLUMN deactivated_at TEXT NULL`.
  - Add the column to `schema.sql` and to the SQLite `CREATE TABLE` in `installSchema()`.
  - `pendingAccounts()` and `approveAccount()` filter on the pending status. `approveAccount` also clears nothing else.

- [ ] **Step 5: Run `npm test`.** Expected: all pass (16).

---

### Task 2: Admin role — creation, sign-in, routing, presentation

**Files:**
- Modify: `backend/src/view.php` (`roleInfo()`; `roleAccent()` uses it)
- Modify: `backend/src/bootstrap.php` (`authenticatedUser(true)` accepts `librarian` or `admin`)
- Modify: `backend/src/pages.php` (`loginRole()`, admin branch in `dashboardPage()`, `approveSubmit()` accepts admin)
- Modify: `backend/views/layout.php` (role label from `roleInfo()`)
- Modify: `backend/views/auth/login.php` (admin mode plus an "Administrator sign-in" link)
- Create: `backend/views/admin-dashboard.php` (Task 2 renders only the heading `User Management` and subtitle `Manage every BookSphere account.`; Task 3 fills it in)
- Create: `backend/bin/create-admin.php`; Modify: `backend/bin/create-librarian.php`
- Modify: `backend/src/auth.php` (new `createStaffAccount()`)
- Rename: `scripts/create-librarian.mjs` → `scripts/create-account.mjs` (first CLI argument is the role)
- Modify: `package.json`:
  - `"backend:admin": "node scripts/create-account.mjs librarian"` (unchanged behaviour)
  - add `"backend:create-admin": "node scripts/create-account.mjs admin"`
- Modify: `README.md`, `ONBOARDING.md`, `backend/README.md` (how to create the first admin and sign in through "Administrator sign-in")
- Test: `tests/php-admin.test.mjs`

**Interfaces:**
- Produces:
  - `roleInfo(string $role): array` returns the same keys as `roleOptions()` entries (`id, label, emoji, description, color, bg`), covering all four roles. `roleOptions()` stays the three sign-up roles.
  - `loginRole(?string $value): ?string` accepts the four roles and returns `null` for anything else. It is used by `loginForm()`/`loginSubmit()`. `registerForm()`/`registerSubmit()` keep `selectedRole()`, so `role=admin` at sign-up falls back to `student`.
  - `createStaffAccount(string $role, string $login, string $email, string $name, string $password): array`:
    - takes the validation and insert from `create-librarian.php`;
    - accepts `$role` of `librarian` or `admin`;
    - inserts an active account and returns the row.

    Both bin scripts read argv and the stdin password and call it. Success output:
    - `Librarian created. Sign in and open Accounts to approve staff.`
    - `Admin created. Sign in with "Administrator sign-in" on the login page.`
  - `dashboardPage()`: `role === 'admin'` → `appPage('admin-dashboard', $user, 'dashboard', 'Admin Dashboard', [...])`. Task 3 adds the vars.
- Login admin mode (`$role === 'admin'`):
  - Render a hidden `<input type="hidden" name="role" value="admin">` instead of the three role cards and the description.
  - Show the heading line `Administrator sign-in` and a link `Not an admin? Choose your role` to `url('login')`.
  - In normal mode, below the form, add a link `Administrator sign-in` to `url('login', ['role' => 'admin'])`.

- [ ] **Step 1: Write the failing tests** (`tests/php-admin.test.mjs`):
  - `the create-admin command creates an admin who lands on the admin dashboard`:
    1. Run `seed(['bin/create-admin.php', 'admin', 'admin@example.test', 'Ada Admin'], 'AdminPassword123!\n')`.
    2. `signIn(agent, 'admin', 'admin', 'AdminPassword123!')` redirects to `/dashboard`.
    3. The page contains `User Management`, `Ada Admin` and `Admin`.
    4. `/catalog` and `/search?q=giver` are 200.
    5. `/my-books` redirects to `/dashboard`.
  - `create-admin rejects a duplicate login`: the same seed again exits non-zero. Use `spawnSync` directly and assert `status !== 0`.
  - `the login page offers an administrator sign-in`:
    - `/login` contains `Administrator sign-in`.
    - `/login?role=admin` contains `name="role" value="admin"` and `Not an admin? Choose your role`.
  - `admin cannot be chosen at sign-up`:
    1. POST `/register` with `role: 'admin'` and valid student fields. It redirects to `/register?role=student&done=1`.
    2. `app.php` shows the stored role is `student`.
  - `admins see no role-specific book actions`: `/books/b1` as admin does not contain `Borrow Book`, `Add to Class Reading List` or `Edit Book Record`.

- [ ] **Step 2: Run `npm test`.** Expected: the new tests FAIL.

- [ ] **Step 3: Implement** per the Interfaces block. `scripts/create-account.mjs`:
  - keeps the hidden-password prompt from `create-librarian.mjs`;
  - spawns `bin/create-admin.php` for `admin` and `bin/create-librarian.php` for `librarian`;
  - otherwise prints usage.

- [ ] **Step 4: Run `npm test`.** Expected: all pass.

---

### Task 3: Admin user directory — counts, search, filters, pagination

**Files:**
- Create: `backend/src/admin.php` (required from `backend/public/index.php` after `auth.php`)
- Modify: `backend/src/pages.php` (`dashboardPage()` admin branch passes data)
- Modify: `backend/views/admin-dashboard.php`
- Test: `tests/php-admin.test.mjs`

**Interfaces:**
- Consumes: `accountStatus()` (Task 1), `roleInfo()` (Task 2).
- Produces:
  - `userCounts(): array` returns `['total' => int, 'active' => int, 'pending' => int, 'deactivated' => int, 'roles' => ['student' => int, 'teacher' => int, 'librarian' => int, 'admin' => int]]`.
  - `userDirectory(string $search, ?string $role, ?string $status, int $page, int $perPage = 50): array` returns `['users' => array, 'total' => int, 'page' => int, 'pages' => int]`.
    - `$role` and `$status` are `null` when unfiltered.
    - `pages` is at least 1, and `page` is clamped to `[1, pages]`.
    - Ordered `created_at DESC, id DESC`.
    - Search is a case-insensitive `LIKE` on `name`, `email` and `login_id`. Escape `\`, `%` and `_` in the term and use `ESCAPE '\'`.
  - `dashboardPage()` admin branch:
    - reads `q` (string), `role` (one of the four roles, else null), `status` (one of the three statuses, else null) and `page` (`(int)`, else 1) from the query;
    - passes `counts`, `directory` and `filters` (`['q' => string, 'role' => ?string, 'status' => ?string]`) to the view.
- View content, using the existing card/table styling from `backend/views/librarian/students.php`:
  - **Stat tiles:** `Total accounts`, `Active`, `Pending approval`, `Deactivated`, plus a row of per-role counts using `roleInfo()` emoji and label.
  - **GET filter form** to `url('dashboard')`:
    - `q` text input (`aria-label="Search accounts"`, placeholder `Search by name, email or login ID…`);
    - `role` and `status` selects with first option `All roles` / `All statuses` (value `''`) and `data-autosubmit`;
    - a `Search` submit button.
  - **Table columns:** `Name`, `Login ID`, `Email`, `Role`, `Status`, `Joined` (`fmtDate($created_at, 'M j, Y')`), `Actions` (empty until Task 4).
    - Each `<tr>` has `data-user-row="{id}"`.
    - Status badges: Active `#E8F8F0`/`#2D7A50`, Pending `#FFF3E8`/`#B56120`, Deactivated `#FEF0EE`/`#E76F51`.
    - The signed-in admin's row shows a `You` pill after the name.
  - **Empty state:** `No accounts match these filters.`
  - **Footer:**
    - `Showing {from}–{to} of {total}`, or `Showing 0 of 0`;
    - `Previous` / `Next` links via `queryWith(['page' => …])`, rendered only when that page exists.

- [ ] **Step 1: Write the failing tests:**
  - `the admin dashboard counts and pages through every account`:
    1. Insert 55 students via `app.php` in a loop. Use `hashPassword('x')`, `is_active = 1`, and distinct `login_id`/`email`.
    2. The dashboard contains `Total accounts`.
    3. Page 1 has 50 `data-user-row` attributes and `Showing 1–50 of {N}`, where N is the total from `app.php("echo userCounts()['total'];")`.
    4. `?page=2` has N−50 rows.
    5. `?page=999` equals the last page; `?page=0`, `?page=-3` and `?page=abc` equal page 1. All are 200.
  - `the admin directory searches and filters`:
    - `?q=tessaly` shows only the teacher.
    - `?role=teacher&status=pending` shows only pending teachers.
    - `?role=root&status=x` returns 200 and shows unfiltered results (same row count as no filters).
    - `?q=%25` and `?q=_` return 200 with `No accounts match these filters.` (no seeded name contains `%` or `_`).
    - `?q=O%27Brien` returns 200.
  - `the admin directory escapes account names`:
    1. Insert a user named `<b>Bold</b> "Quote"`.
    2. The page contains `&lt;b&gt;Bold&lt;/b&gt; &quot;Quote&quot;` and not `<b>Bold</b>`.

- [ ] **Step 2: Run `npm test`.** Expected: the new tests FAIL.

- [ ] **Step 3: Implement** per the Interfaces block.

- [ ] **Step 4: Run `npm test`.** Expected: all pass.

---

### Task 4: Admin actions and safety rules

**Files:**
- Modify: `backend/src/admin.php`
- Modify: `backend/src/pages.php` (route `POST /admin/users/{id}/{action}`)
- Modify: `backend/views/admin-dashboard.php` (Actions column)
- Modify: `backend/public/assets/app.js` (`data-confirm`, documented in the header comment)
- Modify: `README.md`, `ONBOARDING.md`, `backend/README.md` (what the admin dashboard can do; librarians still approve pending staff)
- Test: `tests/php-admin.test.mjs`

**Interfaces:**
- Consumes: `approveAccount()`, `accountStatus()` (Task 1), `forgotPassword()` (existing), `roleInfo()` (Task 2), `userDirectory()` (Task 3).
- Produces (`backend/src/admin.php`). Every function returns the updated user row, or throws `ApiException` with status 422 and the exact message, or 404 `Account not found.`:
  - `deactivateAccount(array $actor, int $id): array`
    - self: `You cannot deactivate your own account.`
    - already deactivated: `This account is already deactivated.`
    - last active admin: `At least one active admin is required.`
    - sets `is_active = 0, deactivated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP`
    - pending accounts may be deactivated
  - `reactivateAccount(int $id): array`
    - not deactivated: `Only deactivated accounts can be reactivated.`
    - sets `is_active = 1, deactivated_at = NULL`
  - `changeAccountRole(array $actor, int $id, string $role): array`
    - invalid role: `Select a valid role.`
    - self: `You cannot change your own role.`
    - demoting the last active admin: `At least one active admin is required.`
    - the same role is a no-op that still succeeds
  - `sendAccountResetLink(int $id): array` calls `forgotPassword(['email' => $user['email']])`.
  - `activeAdminCount(): int`
  - The last-admin checks run inside a transaction. MySQL locks the admin rows with `FOR UPDATE`, as `resetPassword()` does. They exist as a guard against two admins acting at once. Via the web UI they are normally pre-empted by the self rules.
- Route `POST /admin/users/{id}/{action}`, where `action` is one of `approve | deactivate | reactivate | role | reset-link`:
  - **Non-admin:** `flashToast('Admin access is required.', 'warning')`, then redirect to `/dashboard`.
  - **Success toasts:**
    - `{name} approved.`
    - `{name} deactivated.`
    - `{name} reactivated.`
    - `{name} is now {Label}.`, where Label comes from `roleInfo()`, e.g. `Tessaly Teacher is now Librarian.`
    - `Password reset link requested for {email}.`
  - **`ApiException`:** a warning toast with its message.
  - **Redirect:** to `/dashboard` with the filters from the hidden form field `return` (a query string). Keep only `q`, `role`, `status` and `page`.
- Actions column, per row:
  - pending: `Approve`, `Deactivate`, role form, `Send reset link`
  - active: `Deactivate`, role form, `Send reset link`
  - deactivated: `Reactivate`, role form, `Send reset link`
  - own row: `Send reset link` only

  The role form has a `select name="role"` with the four roles (current role selected) and a `Save role` button. Each action is its own POST form with `csrfField()`, the `return` field and `data-busy-text`.

  Confirm prompts:
  - Deactivate: `data-confirm="Deactivate {name}? They will be signed out on their next click."`
  - Save role: `data-confirm="Change {name}'s role?"`

  Build these with `e()`.
- `app.js`: in the submit listener, before the double-submit guard, check whether the submitter or the form has `data-confirm`. If `window.confirm(message)` returns false, call `preventDefault()` and return.

- [ ] **Step 1: Write the failing tests.** Find each user id with `app.php`, and post with the admin's CSRF token. The first test, `deactivation signs the user out and reactivation restores access`:
  1. The teacher signs in in their own browser.
  2. The admin POSTs `/admin/users/{teacherId}/deactivate` with `return: 'q=tess&evil=1'`. It redirects to `/dashboard?q=tess`.
  3. The teacher's next `/dashboard` redirects to `/login`, and their sign-in fails.
  4. The directory shows `Deactivated` for them.
  5. `reactivate` follows; they can sign in again.

  The remaining tests:
  - `admins approve pending accounts`: a newly registered teacher is approved and can sign in, and the toast `{name} approved.` appears.
  - `role changes apply on the next request`: change the signed-in student to `librarian`. The toast reads `Quinlan Reader is now Librarian.`, and their next `/dashboard` contains `Library Dashboard`.
  - `admins can send a reset link`: `mail.log` (in `app.temporary`) gains a line containing the user's URL-encoded email, and the toast `Password reset link requested for …` appears.
  - `admins cannot lock themselves out`:
    - deactivating their own id gives `You cannot deactivate your own account.`;
    - a role change on their own id gives `You cannot change your own role.`;
    - they are still signed in afterwards (the next `/dashboard` is 200);
    - their own row has no `Deactivate` button.
  - `the last active admin cannot be removed`:
    1. Run `app.php` calling `changeAccountRole(['id' => 0, 'role' => 'admin'], {adminId}, 'student')` inside try/catch and echo the message. It gives `At least one active admin is required.`.
    2. The same with `deactivateAccount`.
  - `invalid admin actions change nothing`:
    - `role=root` gives `Select a valid role.`;
    - an unknown id gives `Account not found.`;
    - `reactivate` on an active account gives `Only deactivated accounts can be reactivated.`;
    - an unknown action path gives a 404;
    - nothing returns a 500.
  - `only admins can use admin actions`: a librarian POSTing `/admin/users/{id}/deactivate` redirects to `/dashboard` with `Admin access is required.`, and the target stays active.
  - `toasts escape account names`: deactivate the `<b>Bold</b> "Quote"` user from Task 3. The next page contains no `<b>Bold</b>`. (The toast JSON uses `JSON_HEX_TAG`.)

- [ ] **Step 2: Run `npm test`.** Expected: the new tests FAIL.

- [ ] **Step 3: Implement** per the Interfaces block.

- [ ] **Step 4: Run `npm test`.** Expected: all pass. Then run `node --check backend/public/assets/app.js` and `C:/xampp/php/php.exe -l` on every changed PHP file. Expected: no errors.
