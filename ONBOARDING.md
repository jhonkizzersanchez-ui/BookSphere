# BookSphere — React + PHP + MySQL

BookSphere uses React, Vite, TypeScript and Tailwind for the interface, and plain PHP with PDO/MySQL for authentication. No Laravel or Composer is needed.

## Start locally with XAMPP

1. Start **MySQL** in the XAMPP Control Panel. XAMPP's service is MariaDB, which is compatible with this project.
2. In phpMyAdmin, create a database named `booksphere` using `utf8mb4_unicode_ci`. On this machine, this database already exists and the authentication tables are installed.
3. If your database credentials differ from XAMPP's local defaults (`root`, blank password), copy `backend/config.example.php` to `backend/config.php` and edit the database settings. The local configuration is ignored by Git.
4. From the project root, run:

```powershell
npm install
npm run backend:setup
npm run api
```

5. In a second terminal, run:

```powershell
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:8000` using `C:\xampp\php\php.exe`. The Vite proxy forwards `/api/*` to PHP. The runner accepts `PHP_BIN` if XAMPP is installed somewhere else. This is a PHP development server using XAMPP's PHP and MySQL; Apache is optional.

Setup creates missing authentication tables and preserves existing accounts. It never drops tables. The React signup form creates real student accounts. Teachers and librarians must be approved by an active librarian.

## Create the first librarian

Run this from the project root in an interactive terminal:

```powershell
npm run backend:admin -- librarian library@your-school.edu "School Librarian"
```

Enter a password in the hidden prompt. Use at least 12 characters containing letters and numbers. Passwords are limited to 72 UTF-8 bytes because bcrypt has that limit. No default librarian or demo password is installed.

Sign in with the librarian username or email, then open **Accounts** in the librarian panel to approve pending staff. Verify their school identity before approval. The selected login role affects presentation; the database determines actual permissions. Student IDs currently are not verified against an external school roster.

## Authentication

React calls the PHP JSON API. PHP verifies credentials with `password_verify()`, stores hashes created by `password_hash()`, and uses prepared PDO statements. Sessions use an HttpOnly cookie, strict session IDs and `SameSite=Lax`. Session IDs change at login and logout. A CSRF token is required for all POST requests. The server checks activation and the saved password hash on every protected request, so password changes invalidate old sessions. Login and recovery requests are rate limited in the database.

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

The default `mail_transport` is `log`: recovery URLs are written to the ignored `backend/storage/mail.log`. **This does not deliver inbox email.** To deliver mail, set `mail_transport` to `mail`, set a valid `mail_from`, and configure PHP/XAMPP's mail or sendmail settings for your mail server. PHP logs delivery errors on the server. Staff approval does not send an activation email.

## Using XAMPP Apache instead

Keep only `backend/public` exposed to the web. To serve this directory through Apache, add an alias to XAMPP's Apache configuration:

```apache
Alias /booksphere-api "C:/Users/Jayrald/Desktop/Projects/BookSphere/backend/public"
<Directory "C:/Users/Jayrald/Desktop/Projects/BookSphere/backend/public">
    Options -Indexes
    AllowOverride All
    Require all granted
</Directory>
```

Set `base_path` in `backend/config.php` to `/booksphere-api`. Set this in a root `.env.local` file:

```dotenv
PHP_API_TARGET=http://localhost/booksphere-api
```

Restart Apache and Vite. PHP routes are handled by `backend/public/.htaccess`. The optional Apache alias has not been applied to your global XAMPP configuration. If using this setup, stop `npm run api` and let Apache serve the API. Keep `frontend_url` set to the React URL so recovery links open the right page.

## Checks and deployment

```powershell
npm run build
npm run lint
npm test
npm run test:backend
```

The build includes TypeScript checks. Backend tests start XAMPP PHP with an isolated SQLite database and exercise the real HTTP API, cookies, CSRF, validation, staff approvals, reset-token reuse and rate limits. The live app uses MySQL.

For deployment, serve React's built `dist/` and the PHP API on the same HTTPS origin. The Vite proxy only exists during development. Set `secure_cookies` to `true`, update `frontend_url`, use a dedicated MySQL account, configure real mail delivery, and expose only `backend/public`. PHP `storage`, configuration and source files must remain outside public access. Use a currently supported PHP release for production.

## Current scope

Authentication, sessions, account registration, recovery tokens and staff approval persist in PHP/MySQL. The library catalog, loans, reviews, class rosters and reports still use React demo data in `src/data.ts`; their actions need separate PHP endpoints to become persistent.

The previous Laravel scaffold is preserved in the ignored `.tools/laravel-backup` folder. The active backend has no Laravel dependencies.
