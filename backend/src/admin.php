<?php

declare(strict_types=1);

/* Admin user directory: counts, search, filters and pagination. */

/** Account totals by status and by role. */
function userCounts(): array
{
    $row = sql('SELECT COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END), 0) AS active,
        COALESCE(SUM(CASE WHEN is_active = 0 AND deactivated_at IS NULL THEN 1 ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN is_active = 0 AND deactivated_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS deactivated
        FROM users')->fetch();
    $roles = ['student' => 0, 'teacher' => 0, 'librarian' => 0, 'admin' => 0];
    foreach (sql('SELECT role, COUNT(*) AS total FROM users GROUP BY role')->fetchAll() as $line) {
        if (isset($roles[$line['role']])) {
            $roles[$line['role']] = (int) $line['total'];
        }
    }
    return [
        'total' => (int) $row['total'],
        'active' => (int) $row['active'],
        'pending' => (int) $row['pending'],
        'deactivated' => (int) $row['deactivated'],
        'roles' => $roles,
    ];
}

/** One page of accounts, newest first. $role and $status are null when unfiltered. */
function userDirectory(string $search, ?string $role, ?string $status, int $page, int $perPage = 50): array
{
    $perPage = max(1, $perPage);
    $where = [];
    $params = [];
    if ($search !== '') {
        $term = '%'.strtr(mb_strtolower($search), ['\\' => '\\\\', '%' => '\\%', '_' => '\\_']).'%';
        $where[] = "(LOWER(name) LIKE ? ESCAPE ? OR LOWER(email) LIKE ? ESCAPE ? OR LOWER(login_id) LIKE ? ESCAPE ?)";
        foreach ([1, 2, 3] as $ignored) {
            array_push($params, $term, '\\');
        }
    }
    if ($role !== null) {
        $where[] = 'role = ?';
        $params[] = $role;
    }
    if ($status === 'active') {
        $where[] = 'is_active = 1';
    } elseif ($status === 'pending') {
        $where[] = 'is_active = 0 AND deactivated_at IS NULL';
    } elseif ($status === 'deactivated') {
        $where[] = 'is_active = 0 AND deactivated_at IS NOT NULL';
    }
    $condition = $where ? ' WHERE '.implode(' AND ', $where) : '';

    $total = (int) sql('SELECT COUNT(*) AS total FROM users'.$condition, $params)->fetch()['total'];
    $pages = max(1, (int) ceil($total / $perPage));
    $page = min(max(1, $page), $pages);
    $offset = ($page - 1) * $perPage;
    $users = sql('SELECT * FROM users'.$condition.' ORDER BY created_at DESC, id DESC LIMIT '.$perPage.' OFFSET '.$offset, $params)->fetchAll();

    return ['users' => $users, 'total' => $total, 'page' => $page, 'pages' => $pages];
}

/* ---------- Account actions ---------- */

function activeAdminCount(): int
{
    return (int) sql("SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = 1")->fetch()['total'];
}

/**
 * Runs $change($user) on the account inside a transaction that also locks the active admins (MySQL),
 * so two admins acting at once cannot remove the last one. Returns the refreshed row.
 */
function changeAccount(int $id, callable $change): array
{
    $pdo = database();
    $pdo->beginTransaction();
    try {
        if (appConfig()['db_driver'] === 'mysql') {
            sql("SELECT id FROM users WHERE role = 'admin' AND is_active = 1 FOR UPDATE");
        }
        $user = sql('SELECT * FROM users WHERE id = ?', [$id])->fetch();
        if (! $user) {
            throw new ApiException('Account not found.', 404);
        }
        $change($user);
        $updated = sql('SELECT * FROM users WHERE id = ?', [$id])->fetch();
        $pdo->commit();
        return $updated;
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function deactivateAccount(array $actor, int $id): array
{
    if ((int) $actor['id'] === $id) {
        throw new ApiException('You cannot deactivate your own account.', 422);
    }
    return changeAccount($id, function (array $user) {
        if (accountStatus($user) === 'deactivated') {
            throw new ApiException('This account is already deactivated.', 422);
        }
        if ($user['role'] === 'admin' && (bool) $user['is_active'] && activeAdminCount() <= 1) {
            throw new ApiException('At least one active admin is required.', 422);
        }
        $changed = sql('UPDATE users SET is_active = 0, deactivated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND deactivated_at IS NULL', [$user['id']])->rowCount();
        if ($changed !== 1) {
            throw new ApiException('This account is already deactivated.', 422);
        }
    });
}

function reactivateAccount(int $id): array
{
    return changeAccount($id, function (array $user) {
        if (accountStatus($user) !== 'deactivated') {
            throw new ApiException('Only deactivated accounts can be reactivated.', 422);
        }
        $changed = sql('UPDATE users SET is_active = 1, deactivated_at = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND is_active = 0 AND deactivated_at IS NOT NULL', [$user['id']])->rowCount();
        if ($changed !== 1) {
            throw new ApiException('Only deactivated accounts can be reactivated.', 422);
        }
    });
}

function changeAccountRole(array $actor, int $id, string $role): array
{
    if (! in_array($role, ['student', 'teacher', 'librarian', 'admin'], true)) {
        throw new ApiException('Select a valid role.', 422);
    }
    if ((int) $actor['id'] === $id) {
        throw new ApiException('You cannot change your own role.', 422);
    }
    return changeAccount($id, function (array $user) use ($role) {
        if ($user['role'] === $role) {
            return;
        }
        if ($role === 'admin' && accountStatus($user) === 'pending') {
            throw new ApiException('Approve this account before making it an admin.', 422);
        }
        if ($user['role'] === 'admin' && (bool) $user['is_active'] && activeAdminCount() <= 1) {
            throw new ApiException('At least one active admin is required.', 422);
        }
        $changed = sql('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = ?',
            [$role, $user['id'], $user['role']])->rowCount();
        if ($changed !== 1) {
            throw new ApiException('This account was changed by someone else. Try again.', 422);
        }
    });
}

/** Emails a password reset link to the account (same throttled flow as "Forgot password"). */
function sendAccountResetLink(int $id): array
{
    $user = sql('SELECT * FROM users WHERE id = ?', [$id])->fetch();
    if (! $user) {
        throw new ApiException('Account not found.', 404);
    }
    forgotPassword(['email' => $user['email']]);
    return $user;
}
