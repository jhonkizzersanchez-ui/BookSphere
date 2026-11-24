# Admin role and user-management dashboard

Approved 2026-11-24.

## Intent

Add a separate **admin** role whose dashboard manages every account in the system (real MySQL data). Today the librarian only approves pending staff sign-ups; nobody can see all users, deactivate accounts or change roles.

## Goals

- New `admin` role, separate from librarian, with its own dashboard at `/dashboard`.
- Admin dashboard:
  - Stat tiles: total, active, pending and deactivated accounts; count per role.
  - Table of all accounts (name, login ID, email, role, status, joined date) with search (name, email, login ID), role filter, status filter, 50 rows per page.
  - Row actions: **Approve** (pending), **Deactivate**, **Reactivate**, **Change role** (student, teacher, librarian, admin), **Send reset link** (existing reset flow).
  - Deactivate and role change ask for confirmation first.
- Librarians keep their Accounts section and keep approving pending staff (decision: "Both").

## Safety rules

- `admin` cannot be chosen at sign-up; registration keeps accepting only student, teacher, librarian.
- The first admin is created from the terminal (like the first librarian).
- An admin cannot deactivate or demote themselves; the last active admin cannot be deactivated or demoted.
- Librarians (page and JSON API) may approve only *pending* accounts, never reactivate deactivated ones.
- Changes take effect on the affected user's next request (role and `is_active` are already re-read from the database on every request).

## Non-goals

- Permanent deletion of accounts (deactivate instead).
- Editing names, emails or other profile fields.
- Activity/audit history.

## Constraint: pending vs deactivated

`users.is_active = 0` currently means both "awaiting approval" and would also mean "deactivated". Add a nullable `deactivated_at` timestamp column:

- pending = `is_active = 0 AND deactivated_at IS NULL`
- deactivated = `is_active = 0 AND deactivated_at IS NOT NULL`
- active = `is_active = 1` (reactivating clears `deactivated_at`)

`npm run backend:setup` must add the column to existing databases (MySQL and the SQLite test database) without touching data. The librarian pending list and approval must filter on pending only.

## Approaches

1. **Admin page inside the existing server-rendered PHP app** (chosen): reuses the layout, helpers, CSRF-protected forms, flash toasts and `authenticatedUser()` checks.
2. A new section inside the librarian panel: rejected; the request is a separate role.
3. Manage users through phpMyAdmin: rejected; no safety rules, easy to corrupt hashes or lock everyone out.

## Calls made by the builder (Claude)

- Admin accent colour `#264653`, emoji 🛡️, label "Admin". Admin nav: Dashboard, Catalog, Search.
- Admins sign in on the normal login page via an "Administrator sign-in" link that selects the admin role (the role picker stays at three cards).
- First admin: `npm run backend:create-admin -- <login> <email> "<Name>"` (hidden password prompt, like `backend:admin`).
- The librarian-only JSON API endpoints also accept admins.
- Book details show no role-specific action buttons for admins.
- Confirmation uses a `data-confirm` attribute handled by `assets/app.js` (`window.confirm`).
