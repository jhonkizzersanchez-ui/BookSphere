<?php
/**
 * Librarian panel (ported from LibrarianPanel.tsx).
 * Sections: ?section=dashboard|books|students|reports|accounts, each rendered from views/librarian/{section}.php.
 * Searches: ?section=books&q=... and ?section=students&q=...; ?section=books&add=1 opens the Add Book modal on load.
 * @var array $user @var string $section @var array $pendingAccounts
 */
$navItems = [
    ['id' => 'dashboard', 'label' => 'Dashboard', 'emoji' => '🏠'],
    ['id' => 'books', 'label' => 'Manage Books', 'emoji' => '📚'],
    ['id' => 'students', 'label' => 'Students', 'emoji' => '👥'],
    ['id' => 'reports', 'label' => 'Reports', 'emoji' => '📊'],
    ['id' => 'accounts', 'label' => 'Accounts', 'emoji' => '🔐'],
];
if (! in_array($section ?? null, array_column($navItems, 'id'), true)) {
    $section = 'dashboard';
}
$pendingAccounts ??= [];
$sectionUrl = fn (string $id): string => url('dashboard', ['section' => $id === 'dashboard' ? null : $id]);

$allBooks = books();
$overdueStudents = array_values(array_filter(classStudents(), fn (array $student) => $student['overdueCount'] > 0));
?>
<div class="flex min-h-screen">
  <!-- Inner sidebar -->
  <aside class="hidden md:block w-52 flex-shrink-0 border-r border-[#E8EDF0] bg-white">
    <nav class="p-4 space-y-1 sticky top-16" aria-label="Librarian sections">
      <p class="text-[10px] font-bold uppercase tracking-wider text-[#6B8EA0] mb-3 px-2">Librarian</p>
      <?php foreach ($navItems as $item): $isActive = $section === $item['id']; ?>
        <a href="<?= e($sectionUrl($item['id'])) ?>"<?= $isActive ? ' aria-current="page"' : '' ?>
          class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
          style="background-color: <?= $isActive ? '#F3EEFF' : 'transparent' ?>; color: <?= $isActive ? '#9B5DE5' : '#264653' ?>">
          <span><?= e($item['emoji']) ?></span>
          <?= e($item['label']) ?>
        </a>
      <?php endforeach; ?>
    </nav>
  </aside>

  <!-- Main -->
  <div class="flex-1 min-w-0 px-4 md:px-6 py-5">
    <!-- Mobile nav -->
    <nav class="flex gap-1 p-1 bg-white rounded-xl border border-[#E8EDF0] mb-4 md:hidden" aria-label="Librarian sections">
      <?php foreach ($navItems as $item): $isActive = $section === $item['id']; ?>
        <a href="<?= e($sectionUrl($item['id'])) ?>" title="<?= e($item['label']) ?>" aria-label="<?= e($item['label']) ?>"<?= $isActive ? ' aria-current="page"' : '' ?>
          class="flex-1 py-2 rounded-lg text-xs font-semibold transition-all text-center"
          style="background-color: <?= $isActive ? '#9B5DE5' : 'transparent' ?>; color: <?= $isActive ? 'white' : '#6B8EA0' ?>"><?= e($item['emoji']) ?></a>
      <?php endforeach; ?>
    </nav>

    <?php require __DIR__.'/librarian/'.$section.'.php'; ?>
  </div>

  <?php if ($section === 'books') require __DIR__.'/librarian/book-modal.php'; ?>
</div>
