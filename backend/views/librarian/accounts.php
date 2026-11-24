<?php
/**
 * Librarian panel: Accounts section (ported from AccountApprovals.tsx). Included by librarian-panel.php.
 * Each Approve form posts to /librarian/accounts/{id}/approve; the handler flashes a toast and redirects back here.
 * @var array $pendingAccounts DB user rows awaiting approval
 */
?>
<section class="space-y-4">
  <div>
    <h2 class="text-xl font-bold text-[#264653]">Account approvals</h2>
    <p class="text-sm text-[#6B8EA0]">Verify each person's school identity before approving staff access. Showing up to 100 pending accounts.</p>
  </div>
  <?php if (! $pendingAccounts): ?>
    <p class="p-5 bg-white rounded-2xl border border-[#E8EDF0] text-sm text-[#6B8EA0]">No accounts awaiting approval.</p>
  <?php else: ?>
    <?php foreach ($pendingAccounts as $account): ?>
      <div class="flex flex-wrap gap-4 items-center justify-between p-4 bg-white rounded-2xl border border-[#E8EDF0]">
        <div>
          <p class="font-semibold text-[#264653]"><?= e($account['name']) ?></p>
          <p class="text-sm text-[#6B8EA0]"><?= e($account['email']) ?> · <?= e($account['role']) ?></p>
        </div>
        <form action="<?= e(url('librarian/accounts/'.(int) $account['id'].'/approve')) ?>" method="post">
          <?= csrfField() ?>
          <button type="submit" data-busy-text="Approving…" class="px-4 py-2 rounded-xl bg-[#9B5DE5] text-white text-sm font-semibold disabled:opacity-60">Approve account</button>
        </form>
      </div>
    <?php endforeach; ?>
  <?php endif; ?>
</section>
