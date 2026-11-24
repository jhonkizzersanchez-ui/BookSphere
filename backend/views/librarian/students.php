<?php
/**
 * Librarian panel: Students & Borrowers section. Included by librarian-panel.php.
 * Search: ?section=students&q=... (student name).
 */
$q = queryString('q');
$needle = mb_strtolower($q);
$filteredStudents = array_values(array_filter(classStudents(), fn (array $student) => str_contains(mb_strtolower($student['name']), $needle)));
?>
<div class="space-y-4">
  <div class="flex items-center justify-between flex-wrap gap-3">
    <h1 class="text-2xl font-bold" style="<?= BALOO ?> color: #264653">Students &amp; Borrowers</h1>
    <button type="button"<?= toastAttrs('Bulk reminder sent to all students with overdue books!', 'success') ?>
      class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
      style="background-color: #9B5DE5">
      📬 Send All Reminders
    </button>
  </div>
  <form action="<?= e(url('dashboard')) ?>" method="get" role="search">
    <input type="hidden" name="section" value="students">
    <input type="text" name="q" value="<?= e($q) ?>" placeholder="Search students…" aria-label="Search students"
      class="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF0] bg-white text-sm text-[#264653] focus:outline-none">
  </form>
  <div class="bg-white rounded-2xl border border-[#E8EDF0] overflow-hidden">
    <table class="w-full">
      <thead>
        <tr class="border-b border-[#E8EDF0]">
          <?php foreach (['Student', 'Grade', 'Reading Level', 'Books Read', 'Overdue', 'Last Active'] as $heading): ?>
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B8EA0]"><?= e($heading) ?></th>
          <?php endforeach; ?>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($filteredStudents as $student): ?>
          <tr class="border-b border-[#F0F4F6] hover:bg-[#F8FAFB] transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style="background-color: #9B5DE5">
                  <?= e(mb_substr($student['name'], 0, 1)) ?>
                </div>
                <span class="text-sm font-semibold text-[#264653]"><?= e($student['name']) ?></span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-[#264653]">Grade <?= e($student['grade']) ?></td>
            <td class="px-4 py-3">
              <?= levelBadge($student['readingLevel'], true, 'text-[10px] font-bold px-2 py-0.5') ?>
            </td>
            <td class="px-4 py-3 text-sm font-semibold text-[#264653]"><?= e($student['booksReadThisYear']) ?></td>
            <td class="px-4 py-3">
              <?php if ($student['overdueCount'] > 0): ?>
                <div class="flex items-center gap-1">
                  <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FEF0EE] text-[#E76F51]"><?= e($student['overdueCount']) ?></span>
                  <button type="button"<?= toastAttrs('Reminder sent to '.$student['name'].'!', 'success') ?> class="text-[10px] font-semibold text-[#E76F51] hover:underline">Remind</button>
                </div>
              <?php else: ?>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E8F8F0] text-[#2D7A50]">✓ Clear</span>
              <?php endif; ?>
            </td>
            <td class="px-4 py-3 text-xs text-[#9BB5C0]">
              <?= e(fmtDate($student['lastActive'], 'M j')) ?>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
