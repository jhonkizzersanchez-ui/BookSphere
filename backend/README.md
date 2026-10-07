# BookSphere backend: installation and running

The backend uses plain PHP, PDO and MySQL through XAMPP. It handles registration, login, sessions, password recovery and approval of teacher and librarian accounts. The interface stays in React. Laravel and Composer are not required.

## 1. Install the required tools

1. Download the Windows installer from [Apache Friends: XAMPP](https://www.apachefriends.org/download.html).
2. Run it and keep **Apache**, **MySQL**, **PHP** and **phpMyAdmin** selected. The examples use the installation folder `C:\xampp`.
3. Download and install **Node.js 24 or later**, with npm, from the [official Node.js download page](https://nodejs.org/en/download). This satisfies the installed Vite and ESLint engine requirements.
4. Open a new terminal after installation so Node.js and npm are available.

The commands below assume the project is at `C:\Users\Jayrald\Desktop\Projects\BookSphere`. Skip installing tools that are already present. You can check Node.js and npm in a terminal:

```powershell
node --version
npm --version
```

The backend is compatible with PHP 8.0 or later. PHP must have `pdo_mysql`, `mbstring` and session support enabled. XAMPP on this machine already includes them. Check PHP from PowerShell:

```powershell
& C:\xampp\php\php.exe --version
& C:\xampp\php\php.exe -m
```

You can keep the project in its current folder; it does not need to be moved into `htdocs` for the default setup.

## 2. Start XAMPP and create the database

1. Open the **XAMPP Control Panel**.
2. Start **MySQL**. XAMPP uses MariaDB, which works with this backend.
3. Start **Apache** to use phpMyAdmin.
4. Open [phpMyAdmin](http://localhost/phpmyadmin).
5. Click **New**, enter `booksphere`, choose `utf8mb4_unicode_ci`, and click **Create**. Skip this step if the database already exists.

The database and authentication tables already exist on the current machine. On a fresh installation, create the database before running the setup command below.

## 3. Configure the database connection

The default settings in `config.example.php` are:

| Setting | Local default |
| --- | --- |
| Database host | `127.0.0.1` |
| Database port | `3306` |
| Database name | `booksphere` |
| Database username | `root` |
| Database password | Empty |
| React URL | `http://localhost:5173` |

If these match your XAMPP installation, no configuration change is needed. Otherwise, run the following from the project root, then edit `backend/config.php`:

```powershell
cd C:\Users\Jayrald\Desktop\Projects\BookSphere
Copy-Item backend\config.example.php backend\config.php
```

Copy the example only when `config.php` does not already exist, so you preserve any settings you have changed. This local file is ignored by Git.

If XAMPP is installed elsewhere, set its PHP executable in each PowerShell terminal where you run backend commands:

```powershell
$env:PHP_BIN = 'D:\xampp\php\php.exe'
```

For Command Prompt, the equivalent is:

```bat
set PHP_BIN=D:\xampp\php\php.exe
```

## 4. Install dependencies and create the tables

Run these commands from the **project root**, not the `backend` folder. They work in PowerShell or Command Prompt:

```bat
cd C:\Users\Jayrald\Desktop\Projects\BookSphere
npm install
npm run backend:setup
```

Expected setup message:

```text
BookSphere authentication tables are ready. Existing accounts were preserved.
```

Setup creates missing tables using `schema.sql`. It preserves existing accounts and does not drop tables or create a librarian automatically.

## 5. Run the backend and React interface

Keep MySQL running in XAMPP.

In **terminal 1**, start the API from the project root:

```bat
npm run api
```

The API runs at `http://localhost:8000` using XAMPP's PHP executable and PHP's development server. Leave this terminal open.

In **terminal 2**, open the same project folder and start React:

```bat
cd C:\Users\Jayrald\Desktop\Projects\BookSphere
npm run dev
```

Open [BookSphere](http://localhost:5173). Vite forwards requests beginning with `/api` to the PHP server.

Apache is needed for phpMyAdmin in this setup. The API itself runs through `npm run api`. To serve the API with Apache instead, follow the optional alias configuration in [ONBOARDING.md](../ONBOARDING.md#using-xampp-apache-instead).

Press **Ctrl+C** in each terminal to stop its server. To run the app again later, start MySQL, `npm run api`, and `npm run dev`; you do not need to repeat installation or table setup each time.

## 6. Sign in as a librarian and approve staff

On the current machine, an active account with username **`librarian`** has already been created. Use the password provided in the setup conversation. Passwords are not included in this document.

For a fresh database, create your first active librarian from an interactive terminal:

```bat
npm run backend:admin -- librarian librarian@your-school.edu "School Librarian"
```

Replace the email with your actual librarian email. The command asks for a password without displaying it. Use at least 12 characters containing letters and numbers, up to 72 UTF-8 bytes. This command creates an account; it does not reset an existing account's password. Use a different username and email if either already exists.

Then:

1. Open BookSphere and select **Librarian**.
2. Sign in with the librarian username or email and password.
3. Open **Accounts** in the librarian panel.
4. Check the pending registration and click **Approve** for authorized staff.

Students are activated on registration. Teachers and librarians remain pending until an active librarian approves them. Permissions are checked against the database role.

## 7. View the saved data

Open [phpMyAdmin](http://localhost/phpmyadmin), select **booksphere**, choose a table, and click **Browse**.

| Table | Saved data |
| --- | --- |
| `users` | Account names, login IDs, emails, hashed passwords, roles and activation status |
| `password_reset_tokens` | Hashed, expiring password recovery tokens |
| `auth_rate_limits` | Counters that limit repeated authentication attempts |

Passwords are hashed and cannot be viewed as their original text. Older installations may contain additional tables from the previous Laravel setup; the plain PHP backend uses the three tables above.

Books, loans, reviews and dashboard reports still use the React demo data in `src/data.ts`. They are not yet stored in MySQL.

## 8. Check that the backend is working

Open [API health](http://localhost:8000/api/health). Expected response:

```json
{"service":"BookSphere PHP API"}
```

This confirms the PHP API is reachable. It does not check the database. Sign in to confirm the database connection and authentication are working.

To run automated backend checks from the project root:

```bat
npm run test:backend
```

These tests run a separate PHP server with a temporary SQLite database, so they do not change your MySQL accounts. The tests also require `pdo_sqlite`, which the installed XAMPP PHP includes.

## 9. Password recovery

The local default writes password reset links to `backend/storage/mail.log`; it does not deliver email to an inbox. Request a reset from **Forgot password?**, then open the log locally to get the link.

For email delivery, set `mail_transport` to `mail` and configure PHP/XAMPP's mail or sendmail settings and `mail_from` for your mail server. See [ONBOARDING.md](../ONBOARDING.md#password-recovery) for more details.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `Port 5173 is already in use` | An existing React server is running. Use its page or press Ctrl+C in its terminal before starting another. |
| Port `8000` is already in use | An API server may already be running. Check `/api/health` and stop the previous server in its terminal before starting another. |
| `Unable to run PHP` | Check `C:\xampp\php\php.exe` exists, or set `PHP_BIN` to the correct executable. |
| `Unknown database 'booksphere'` | Create the database in phpMyAdmin, then run `npm run backend:setup`. |
| Database connection refused | Start MySQL in XAMPP and check the host and port in the PHP configuration. |
| `Access denied for user` | Match the database username and password in `backend/config.php` to your MySQL settings. |
| `could not find driver` | Enable `pdo_mysql` in the selected PHP installation's `php.ini`, then restart the API. |
| phpMyAdmin will not open | Start Apache and MySQL; check XAMPP's logs if either service fails to start. |
| React cannot reach the API | Keep `npm run api` running. Use `localhost` for both URLs. Check `PHP_API_TARGET` if an Apache target was configured earlier. |
| Staff cannot sign in | Sign in as an active librarian and approve their registration under **Accounts**. |
| Reset email does not arrive | Local recovery uses `backend/storage/mail.log` until real mail delivery is configured. |

The blank MySQL root password and HTTP development server described here are for local development. Deployment requires HTTPS, secure cookies, a dedicated database user, real email delivery and exposing only `backend/public`; see [ONBOARDING.md](../ONBOARDING.md#checks-and-deployment).
