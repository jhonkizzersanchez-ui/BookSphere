<?php
/**
 * Librarian panel: Dashboard section. Included by librarian-panel.php.
 * @var array $allBooks @var array $overdueStudents
 */
$totalBooks = count($allBooks);
$totalCopies = array_sum(array_column($allBooks, 'totalCopies'));
$borrowedCopies = array_sum(array_column($allBooks, 'borrowedCopies'));
$overdueStudentCount = count($overdueStudents);

$stats = [
    ['label' => 'Total Titles', 'value' => $totalBooks, 'sub' => 'in collection', 'emoji' => '📖', 'color' => '#9B5DE5'],
    ['label' => 'Total Copies', 'value' => $totalCopies, 'sub' => $borrowedCopies.' borrowed', 'emoji' => '📚', 'color' => '#2A9D8F'],
    ['label' => 'Checked Out', 'value' => $borrowedCopies, 'sub' => ($totalCopies - $borrowedCopies).' available', 'emoji' => '📤', 'color' => '#4361EE'],
    ['label' => 'Overdue Items', 'value' => array_sum(array_column($overdueStudents, 'overdueCount')), 'sub' => $overdueStudentCount.' students', 'emoji' => '⚠️', 'color' => '#E76F51'],
];

$activity = [
    ['action' => 'Book borrowed', 'detail' => 'Alex Rivera checked out "The Giver"', 'time' => '2 hours ago', 'icon' => '📤', 'color' => '#2A9D8F'],
    ['action' => 'Book returned', 'detail' => 'Maya Thompson returned "Holes"', 'time' => '3 hours ago', 'icon' => '📥', 'color' => '#52B788'],
    ['action' => 'New request', 'detail' => 'Ms. Chen requested 12 copies of "The Giver"', 'time' => 'Yesterday', 'icon' => '📦', 'color' => '#4361EE'],
    ['action' => 'Overdue reminder', 'detail' => 'Reminder sent to Noah Kim', 'time' => 'Yesterday', 'icon' => '📬', 'color' => '#F4A261'],
];
?>
<div class="space-y-5">
  <h1 class="text-2xl font-bold" style="<?= BALOO ?> color: #264653">Library Dashboard</h1>

  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <?php foreach ($stats as $stat): ?>
      <div class="bg-white rounded-2xl p-4 border border-[#E8EDF0]">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-[#6B8EA0]"><?= e($stat['label']) ?></span>
          <span class="text-lg"><?= e($stat['emoji']) ?></span>
        </div>
        <p class="text-3xl font-bold" style="color: <?= e($stat['color']) ?>; <?= BALOO ?>"><?= e($stat['value']) ?></p>
        <p class="text-xs text-[#9BB5C0] mt-0.5"><?= e($stat['sub']) ?></p>
      </div>
    <?php endforeach; ?>
  </div>

  <!-- Quick actions -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <a href="<?= e(url('dashboard', ['section' => 'books', 'add' => 1])) ?>"
      class="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-[#9B5DE5]/40 bg-[#F3EEFF]/60 hover:border-[#9B5DE5] transition-all text-left">
      <span class="text-2xl">➕</span>
      <div>
        <p class="font-bold text-[#264653]" style="<?= BALOO ?>">Add New Book</p>
        <p class="text-xs text-[#6B8EA0]">Add a title to the catalog</p>
      </div>
    </a>
    <button type="button"<?= toastAttrs('Overdue reminders sent to all affected students!', 'success') ?>
      class="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-[#E76F51]/40 bg-[#FEF0EE]/60 hover:border-[#E76F51] transition-all text-left">
      <span class="text-2xl">📬</span>
      <div>
        <p class="font-bold text-[#264653]" style="<?= BALOO ?>">Send Overdue Notices</p>
        <p class="text-xs text-[#6B8EA0]"><?= e($overdueStudentCount) ?> student<?= $overdueStudentCount !== 1 ? 's' : '' ?> with overdue books</p>
      </div>
    </button>
  </div>

  <!-- Recent activity -->
  <div class="bg-white rounded-2xl border border-[#E8EDF0] p-5">
    <h3 class="font-bold mb-3" style="<?= BALOO ?> color: #264653">Recent Activity</h3>
    <div class="space-y-3">
      <?php foreach ($activity as $item): ?>
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: <?= e($item['color']) ?>18">
            <span class="text-sm"><?= e($item['icon']) ?></span>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-[#264653]"><?= e($item['action']) ?></p>
            <p class="text-xs text-[#6B8EA0]"><?= e($item['detail']) ?></p>
          </div>
          <span class="text-xs text-[#9BB5C0] flex-shrink-0"><?= e($item['time']) ?></span>
        </div>
      <?php endforeach; ?>
    </div>
  </div>
</div>
