# BookSphere — PHP + MySQL

BookSphere is a server-rendered PHP app. PHP builds every page from the templates in `backend/views` and uses PDO/MySQL for authentication. There is no React, Vite, TypeScript or Node build step, and no Laravel or Composer. Node.js is only used as a convenience runner for PHP (`npm run ...`) and for the tests.

Styles come from Tailwind CSS, loaded in the browser from the jsDelivr CDN (`@tailwindcss/browser@4.1.11`), with fonts from Google Fonts. The browser needs internet access for the styles. Without it, pages still work but appear unstyled.

## Start locally with XAMPP

1. Start **MySQL** in the XAMPP Control Panel. XAMPP's service is MariaDB, which is compatible with this project.
2. In phpMyAdmin, create a database named `booksphere` using `utf8mb4_unicode_ci`. On this machine, this database already exists and the authentication tables are installed.
3. If your database credentials differ from XAMPP's local defaults (`root`, blank password), copy `backend/config.example.php` to `backend/config.php` and edit the database settings. The local configuration is ignored by Git.
4. From the project root, run:

```powershell
npm run backend:setup
npm run api
```

Open `http://localhost:8000`. `npm run dev` does the same thing as `npm run api`. Both start PHP's development server with `C:\xampp\php\php.exe` and serve the whole app, pages and `/api/*`, from `backend/public`. The runner accepts `PHP_BIN` if XAMPP is installed somewhere else. There are no npm packages to install. This is a PHP development server using XAMPP's PHP and MySQL; Apache is optional.

Setup creates missing authentication tables and preserves existing accounts. It never drops tables. The sign-up form creates real student accounts. Teachers and librarians must be approved by an active librarian.

## How the app is organised

| Path | Contents |
| --- | --- |
| `backend/public/index.php` | Entry point. Sends `/api/*` to the JSON API and every other path to the page router |
| `backend/public/router.php` | Router for PHP's development server: serves real static files and sends everything else to `index.php` |
| `backend/public/.htaccess` | The same routing for Apache |
| `backend/public/assets/` | `app.js` (toasts, menus, modals and other small behaviours driven by `data-*` attributes), `app.css` and `favicon.svg` |
| `backend/src/pages.php` | Page routes, form handling and redirects |
| `backend/src/view.php` | Rendering, escaping (`e()`), URLs, CSRF fields, flash messages and shared UI pieces such as book covers |
| `backend/src/api.php` | JSON API |
| `backend/src/auth.php`, `backend/src/bootstrap.php` | Accounts, sessions, validation, rate limits and database access |
| `backend/src/data.php` | Demo library data |
| `backend/views/` | Templates: `layout.php` (signed-in shell), `guest.php` (signed-out pages), `partials/`, `auth/`, `librarian/` and one file per page |

| Page | Purpose |
| --- | --- |
| `/login`, `/register` | Sign in and sign up |
| `/forgot-password`, `/reset-password` | Password recovery |
| `/dashboard` | Dashboard for the signed-in role. The librarian panel uses `?section=` (`dashboard`, `books`, `students`, `reports`, `accounts`) |
| `/catalog`, `/search?q=`, `/books/{id}` | Catalog, search and book details |
| `/my-books` | My Books (students only) |

Signed-out visitors are redirected to `/login`.

## Create the first librarian

Run this from the project root in an interactive terminal:

```powershell
npm run backend:admin -- librarian library@your-school.edu "School Librarian"
```

Enter a password in the hidden prompt. Use at least 12 characters containing letters and numbers. Passwords are limited to 72 UTF-8 bytes because bcrypt has that limit. No default librarian or demo password is installed.

Sign in with the librarian username or email, then open **Accounts** in the librarian panel to approve pending staff. Verify their school identity before approval. The selected login role affects presentation; the database determines actual permissions. Student IDs currently are not verified against an external school roster.

## Authentication

Pages submit ordinary HTML forms to PHP. PHP verifies credentials with `password_verify()`, stores hashes created by `password_hash()`, and uses prepared PDO statements. Sessions use an HttpOnly cookie, strict session IDs and `SameSite=Lax`. Session IDs change at login and logout. Every form POST must include the session's CSRF token in a hidden `_csrf` field (templates add it with `csrfField()`); a missing or invalid token sends the visitor back with a "Your session expired" message. The server checks activation and the saved password hash on every protected request, so password changes invalidate old sessions. Sign-in, sign-up and recovery requests are rate limited in the database.

The pages call the authentication functions directly. The JSON API is still available under `/api` and requires the CSRF token in an `X-XSRF-TOKEN` header for POST requests:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API availability; does not check MySQL |
| GET | `/api/auth/csrf` | Initialize session/CSRF cookies |
| POST | `/api/auth/register` | Create student or pending staff account |
| POST | `/api/auth/login` | Verify credentials and start session |
| GET | `/api/auth/me` | Restore authenticated account |
| POST | `/api/auth/logout` | End authenticated session |
| POST | `/api/auth/forgot-password` | Request recovery email |
| POST | `/api/auth/reset-password` | Consume a reset token |
| GET | `/api/admin/users` | Librarian-only pending accounts |
| POST | `/api/admin/users/{id}/approve` | Librarian-only approval |

## Password recovery

All roles use their registered email. Reset tokens are random, stored as SHA-256 hashes, expire after 60 minutes, and can be used once. Responses do not disclose whether an email belongs to an account.

Reset links have the form `{app_url}{base_path}/reset-password?reset_token=…&email=…`. Keep `app_url` set to the address people use to open BookSphere, without `base_path`. The default is `http://localhost:8000`. (`app_url` replaces the old `frontend_url` setting.)

The default `mail_transport` is `log`: recovery URLs are written to the ignored `backend/storage/mail.log`. **This does not deliver inbox email.** To deliver mail, set `mail_transport` to `mail`, set a valid `mail_from`, and configure PHP/XAMPP's mail or sendmail settings for your mail server. PHP logs delivery errors on the server. Staff approval does not send an activation email.

## Using XAMPP Apache instead

Keep only `backend/public` exposed to the web. Apache serves the whole app, pages and API, from this directory. Add an alias to XAMPP's Apache configuration:

```apache
Alias /booksphere "C:/Users/Jayrald/Desktop/Projects/BookSphere/backend/public"
<Directory "C:/Users/Jayrald/Desktop/Projects/BookSphere/backend/public">
    Options -Indexes
    AllowOverride All
    Require all granted
</Directory>
```

In `backend/config.php`, set `base_path` to `/booksphere` and `app_url` to `http://localhost`. Because the folder is reached through an alias, also uncomment `RewriteBase /booksphere` in `backend/public/.htaccess`. Restart Apache and open `http://localhost/booksphere`. Routes are handled by `backend/public/.htaccess`, which serves the files in `assets/` directly and sends everything else to `index.php`. The optional Apache alias has not been applied to your global XAMPP configuration. If using this setup, you do not need `npm run api`.

There is no separate frontend server or proxy any more, so `PHP_API_TARGET` and `.env.local` are no longer used.

## Checks and deployment

```powershell
npm test
```

`npm test` runs every `tests/*.test.mjs` file with Node's built-in test runner (`npm run test:backend` is the same command). The tests start XAMPP PHP with an isolated SQLite database and exercise the real HTTP API and pages: cookies, CSRF tokens in headers and form fields, validation, sign-up and sign-in, error messages, HTML escaping, staff approvals, reset-token reuse and rate limits. The live app uses MySQL. There is no build or lint step.

For deployment, serve `backend/public` over HTTPS, as the web root or through an alias with `base_path`. Set `secure_cookies` to `true`, set `app_url` to the public HTTPS address, use a dedicated MySQL account, configure real mail delivery, and expose only `backend/public`. PHP `storage`, configuration, `src` and `views` must remain outside public access. Visitors' browsers load Tailwind from `cdn.jsdelivr.net` and fonts from Google Fonts. Use a currently supported PHP release for production.

## Current scope

Authentication, sessions, account registration, recovery tokens and staff approval persist in PHP/MySQL. The library catalog, loans, reviews, class rosters and reports still use demo data in `backend/src/data.php`; their actions are not saved and need PHP routes and tables to become persistent.

The previous Laravel scaffold is preserved in the ignored `.tools/laravel-backup` folder. The active backend has no Laravel dependencies.
