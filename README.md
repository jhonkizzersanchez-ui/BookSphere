# BookSphere

School library app rendered entirely by plain PHP, with MySQL authentication using XAMPP. There is no React, Vite or Node build step; Node.js is only used to run PHP through `npm` scripts and to run the tests.

Start MySQL in XAMPP, create the `booksphere` database, then run:

```powershell
npm run backend:setup
npm run api
```

Open `http://localhost:8000`. `npm run dev` is an alias of `npm run api`. Pages load Tailwind CSS from the jsDelivr CDN, so the browser needs internet access for styles. See [ONBOARDING.md](ONBOARDING.md) for configuration, how the app is organised, creating the first librarian and admin (`npm run backend:create-admin`, then **Administrator sign-in** on the login page), password recovery, and the optional Apache setup. Admins manage accounts from the dashboard (approve, deactivate, reactivate, change role, send a reset link); librarians still approve pending staff.

For step-by-step XAMPP installation, database setup, run commands and troubleshooting, see the [backend installation guide](backend/README.md).

Authentication and staff approvals are persistent. Library catalog, loans, reviews and reports currently use demo data from `backend/src/data.php`.
