<?php
/**
 * Admin dashboard: account counts and the user directory.
 * @var array $user
 * @var array $counts
 * @var array $directory
 * @var array $filters
 */
$statusBadges = [
    'active' => ['Active', '#E8F8F0', '#2D7A50'],
    'pending' => ['Pending', '#FFF3E8', '#B56120'],
    'deactivated' => ['Deactivated', '#FEF0EE', '#E76F51'],
];
$tiles = [
    ['Total accounts', $counts['total'], '#264653'],
    ['Active', $counts['active'], '#2D7A50'],
    ['Pending approval', $counts['pending'], '#B56120'],
    ['Deactivated', $counts['deactivated'], '#E76F51'],
];
$inputCls = 'px-4 py-2.5 rounded-xl border border-[#E8EDF0] bg-white text-sm text-[#264653] focus:outline-none';
$returnQuery = http_build_query(array_filter(
    ['q' => $filters['q'], 'role' => $filters['role'], 'status' => $filters['status'], 'page' => $directory['page'] > 1 ? $directory['page'] : null],
    fn ($value) => $value !== null && $value !== ''
));
$btnCls = 'px-3 py-1.5 rounded-xl text-xs font-bold border border-[#E8EDF0] bg-white text-[#264653]';
$total = $directory['total'];
$from = $total === 0 ? 0 : ($directory['page'] - 1) * 50 + 1;
$to = $total === 0 ? 0 : $from + count($directory['users']) - 1;
?>
<div class="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
  <div>
    <h1 class="text-2xl font-bold mb-1" style="<?= BALOO ?> color: #264653">User Management</h1>
    <p class="text-sm text-[#6B8EA0]">Manage every BookSphere account.</p>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <?php foreach ($tiles as [$label, $value, $color]): ?>
      <div class="bg-white rounded-2xl border border-[#E8EDF0] p-4">
        <p class="text-2xl font-bold" style="<?= BALOO ?> color: <?= e($color) ?>"><?= e($value) ?></p>
        <p class="text-xs font-bold uppercase tracking-wide text-[#6B8EA0]"><?= e($label) ?></p>
      </div>
    <?php endforeach; ?>
  </div>
  <div class="flex flex-wrap gap-2">
    <?php foreach ($counts['roles'] as $roleId => $count): $info = roleInfo($roleId); ?>
      <span class="text-xs font-bold px-3 py-1 rounded-full" style="background-color: <?= e($info['bg']) ?>; color: <?= e($info['color']) ?>">
        <?= e($info['emoji']) ?> <?= e($info['label']) ?> <?= e($count) ?>
      </span>
    <?php endforeach; ?>
  </div>

  <form action="<?= e(url('dashboard')) ?>" method="get" role="search" class="flex flex-wrap gap-2">
    <input type="text" name="q" value="<?= e($filters['q']) ?>" placeholder="Search by name, email or login ID…" aria-label="Search accounts"
      class="flex-1 min-w-[12rem] <?= $inputCls ?>">
    <select name="role" data-autosubmit aria-label="Filter by role" class="<?= $inputCls ?>">
      <option value="">All roles</option>
      <?php foreach (array_keys($counts['roles']) as $roleId): ?>
        <option value="<?= e($roleId) ?>"<?= $filters['role'] === $roleId ? ' selected' : '' ?>><?= e(roleInfo($roleId)['label']) ?></option>
      <?php endforeach; ?>
    </select>
    <select name="status" data-autosubmit aria-label="Filter by status" class="<?= $inputCls ?>">
      <option value="">All statuses</option>
      <?php foreach ($statusBadges as $statusId => [$statusLabel]): ?>
        <option value="<?= e($statusId) ?>"<?= $filters['status'] === $statusId ? ' selected' : '' ?>><?= e($statusLabel) ?></option>
      <?php endforeach; ?>
    </select>
    <button type="submit" class="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style="background-color: #264653">Search</button>
  </form>

  <div class="bg-white rounded-2xl border border-[#E8EDF0] overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="border-b border-[#E8EDF0]">
          <?php foreach (['Name', 'Login ID', 'Email', 'Role', 'Status', 'Joined', 'Actions'] as $heading): ?>
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B8EA0]"><?= e($heading) ?></th>
          <?php endforeach; ?>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($directory['users'] as $row):
          $info = roleInfo($row['role']);
          [$statusLabel, $statusBg, $statusColor] = $statusBadges[accountStatus($row)]; ?>
          <tr data-user-row="<?= e($row['id']) ?>" class="border-b border-[#F0F4F6] hover:bg-[#F8FAFB] transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style="background-color: <?= e($info['color']) ?>">
                  <?= e(initials($row['name'])) ?>
                </div>
                <span class="text-sm font-semibold text-[#264653]"><?= e($row['name']) ?></span>
                <?php if ((int) $row['id'] === (int) $user['id']): ?>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8EDF0] text-[#264653]">You</span>
                <?php endif; ?>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-[#264653]"><?= e($row['login_id']) ?></td>
            <td class="px-4 py-3 text-sm text-[#264653]"><?= e($row['email']) ?></td>
            <td class="px-4 py-3">
              <span class="text-xs font-bold px-2 py-0.5 rounded-full" style="background-color: <?= e($info['bg']) ?>; color: <?= e($info['color']) ?>"><?= e($info['label']) ?></span>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs font-bold px-2 py-0.5 rounded-full" style="background-color: <?= e($statusBg) ?>; color: <?= e($statusColor) ?>"><?= e($statusLabel) ?></span>
            </td>
            <td class="px-4 py-3 text-xs text-[#9BB5C0]"><?= e(($row['created_at'] ?? '') === '' ? '—' : fmtDate($row['created_at'], 'M j, Y')) ?></td>
            <td class="px-4 py-3">
              <?php
              $rowId = (int) $row['id'];
              $rowStatus = accountStatus($row);
              $isSelf = $rowId === (int) $user['id'];
              $actions = [];
              if (! $isSelf && $rowStatus === 'pending') $actions[] = ['approve', 'Approve', 'Approving…', null];
              if (! $isSelf && $rowStatus !== 'deactivated') $actions[] = ['deactivate', 'Deactivate', 'Deactivating…', 'Deactivate '.$row['name'].'? They will be signed out on their next click.'];
              if (! $isSelf && $rowStatus === 'deactivated') $actions[] = ['reactivate', 'Reactivate', 'Reactivating…', null];
              ?>
              <div class="flex flex-wrap items-center gap-2">
                <?php foreach ($actions as [$action, $label, $busy, $confirm]): ?>
                  <form method="post" action="<?= e(url('admin/users/'.$rowId.'/'.$action)) ?>">
                    <?= csrfField() ?>
                    <input type="hidden" name="return" value="<?= e($returnQuery) ?>">
                    <button type="submit" data-busy-text="<?= e($busy) ?>"<?= $confirm !== null ? ' data-confirm="'.e($confirm).'"' : '' ?> class="<?= $btnCls ?>"><?= e($label) ?></button>
                  </form>
                <?php endforeach; ?>
                <?php if (! $isSelf): ?>
                  <form method="post" action="<?= e(url('admin/users/'.$rowId.'/role')) ?>" class="flex items-center gap-1">
                    <?= csrfField() ?>
                    <input type="hidden" name="return" value="<?= e($returnQuery) ?>">
                    <select name="role" aria-label="Role for <?= e($row['name']) ?>" class="px-2 py-1.5 rounded-xl border border-[#E8EDF0] bg-white text-xs text-[#264653]">
                      <?php foreach (array_keys($counts['roles']) as $roleId): if ($roleId === 'admin' && $rowStatus === 'pending') continue; ?>
                        <option value="<?= e($roleId) ?>"<?= $row['role'] === $roleId ? ' selected' : '' ?>><?= e(roleInfo($roleId)['label']) ?></option>
                      <?php endforeach; ?>
                    </select>
                    <button type="submit" data-busy-text="Saving…" data-confirm="<?= e('Change '.$row['name']."'s role?") ?>" class="<?= $btnCls ?>">Save role</button>
                  </form>
                <?php endif; ?>
                <form method="post" action="<?= e(url('admin/users/'.$rowId.'/reset-link')) ?>">
                  <?= csrfField() ?>
                  <input type="hidden" name="return" value="<?= e($returnQuery) ?>">
                  <button type="submit" data-busy-text="Sending…" class="<?= $btnCls ?>">Send reset link</button>
                </form>
              </div>
            </td>
          </tr>
        <?php endforeach; ?>
        <?php if (! $directory['users']): ?>
          <tr><td colspan="7" class="px-4 py-8 text-center text-sm text-[#6B8EA0]">No accounts match these filters.</td></tr>
        <?php endif; ?>
      </tbody>
    </table>
  </div>

  <div class="flex items-center justify-between flex-wrap gap-3 text-sm text-[#6B8EA0]">
    <p><?= $total === 0 ? 'Showing 0 of 0' : e('Showing '.$from.'–'.$to.' of '.$total) ?></p>
    <div class="flex gap-2">
      <?php if ($directory['page'] > 1): ?>
        <a href="<?= e(queryWith(['page' => $directory['page'] - 1])) ?>" class="px-3 py-1.5 rounded-xl border border-[#E8EDF0] bg-white font-semibold text-[#264653]">Previous</a>
      <?php endif; ?>
      <?php if ($directory['page'] < $directory['pages']): ?>
        <a href="<?= e(queryWith(['page' => $directory['page'] + 1])) ?>" class="px-3 py-1.5 rounded-xl border border-[#E8EDF0] bg-white font-semibold text-[#264653]">Next</a>
      <?php endif; ?>
    </div>
  </div>
</div>
