<?php
/**
 * Signed-in app shell (ported from App.tsx + Navbar.tsx).
 * @var array $user @var string $active @var string $title @var string $content
 */
$role = $user['role'];
$accent = roleAccent($role);
$roleLabel = roleInfo($role)['label'];
$navItems = [
    ['key' => 'dashboard', 'href' => url('dashboard'), 'label' => 'Dashboard', 'emoji' => '🏠'],
    ['key' => 'catalog', 'href' => url('catalog'), 'label' => 'Catalog', 'emoji' => '📚'],
];
if ($role === 'student') {
    $navItems[] = ['key' => 'my-books', 'href' => url('my-books'), 'label' => 'My Books', 'emoji' => '🔖'];
}
$navItems[] = ['key' => 'search', 'href' => url('search'), 'label' => 'Search', 'emoji' => '🔍'];
$searchValue = $active === 'search' ? queryString('q') : '';
$navLink = function (array $item) use ($active, $accent): string {
    $isActive = $item['key'] === $active;
    return '<a href="'.e($item['href']).'" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left w-full"'
        .' style="background-color: '.($isActive ? $accent.'15' : 'transparent').'; color: '.($isActive ? $accent : '#264653').'"'
        .($isActive ? ' aria-current="page"' : '').'>'
        .'<span class="text-base">'.$item['emoji'].'</span>'.e($item['label']).'</a>';
};
?>
<!doctype html>
<html lang="en">
<head>
<?php require __DIR__.'/partials/head.php'; ?>
</head>
<body>
<div class="min-h-screen" style="background-color: #FDFBF7">
  <!-- Top navbar -->
  <header class="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 gap-3 border-b border-[#E8EDF0]" style="background-color: #FDFBF7">
    <button type="button" class="md:hidden flex-shrink-0 p-2 rounded-lg hover:bg-[#E8F5F3] transition-colors" data-toggle="#mobile-sidebar" aria-label="Toggle menu">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="#264653" stroke-width="1.8" stroke-linecap="round"/></svg>
    </button>

    <a href="<?= e(url('dashboard')) ?>" class="flex items-center gap-2 flex-shrink-0 group">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style="background-color: #2A9D8F">📚</div>
      <span class="hidden sm:block text-xl font-bold" style="<?= BALOO ?>">
        <span style="color: #2A9D8F">Book</span><span style="color: #F4A261">Sphere</span>
      </span>
    </a>

    <form action="<?= e(url('search')) ?>" method="get" class="flex-1 max-w-xl mx-auto" role="search">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="#6B8EA0" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="#6B8EA0" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input type="text" id="navbar-search" name="q" value="<?= e($searchValue) ?>" required aria-label="Search books" placeholder="Search books, authors, genres…"
          class="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E8EDF0] bg-white text-sm text-[#264653] placeholder:text-[#9BB5C0] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/30 focus:border-[#2A9D8F] transition-all">
        <?php if ($active === 'search'): foreach (['genre', 'level', 'available'] as $keep): if (queryString($keep) !== ''): ?>
          <input type="hidden" name="<?= $keep ?>" value="<?= e(queryString($keep)) ?>">
        <?php endif; endforeach; endif; ?>
        <button type="button" data-clear="#navbar-search" <?= $searchValue === '' ? 'hidden' : '' ?> aria-label="Clear search" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#9BB5C0] hover:text-[#264653]">✕</button>
      </div>
    </form>

    <a href="<?= e(url('catalog')) ?>" class="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors <?= $active === 'catalog' ? 'bg-[#E8F5F3] text-[#2A9D8F]' : 'text-[#264653] hover:bg-[#F0F4F6]' ?>">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="5" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="3" width="5" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      Catalog
    </a>

    <details class="relative flex-shrink-0" data-dropdown>
      <summary class="list-none flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#F0F4F6] transition-colors cursor-pointer">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style="background-color: <?= $accent ?>"><?= e(initials($user['name'])) ?></div>
        <div class="hidden sm:block text-left">
          <p class="text-xs font-semibold text-[#264653] leading-tight"><?= e($user['name']) ?></p>
          <p class="text-[10px] text-[#6B8EA0] leading-tight"><?= e($roleLabel) ?></p>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="hidden sm:block text-[#6B8EA0]"><path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </summary>
      <div class="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg border border-[#E8EDF0] py-1 z-50" style="background-color: #FDFBF7">
        <div class="px-4 py-2 border-b border-[#E8EDF0]">
          <p class="text-sm font-semibold text-[#264653]"><?= e($user['name']) ?></p>
          <p class="text-xs text-[#6B8EA0]"><?= e($roleLabel) ?></p>
        </div>
        <form action="<?= e(url('logout')) ?>" method="post">
          <?= csrfField() ?>
          <button type="submit" data-busy-text="Signing out…" class="w-full text-left px-4 py-2 text-sm text-[#E76F51] hover:bg-[#FEF0EE] transition-colors">Sign out</button>
        </form>
      </div>
    </details>
  </header>

  <div class="flex" style="padding-top: 64px">
    <!-- Desktop sidebar -->
    <aside class="hidden md:flex flex-col flex-shrink-0 border-r border-[#E8EDF0] bg-white sticky overflow-y-auto" style="width: 220px; top: 64px; height: calc(100vh - 64px)">
      <nav class="p-3 flex flex-col gap-1 flex-1">
        <p class="text-[10px] font-bold uppercase tracking-widest px-3 py-2" style="color: #9BB5C0"><?= e($roleLabel) ?></p>
        <?php foreach ($navItems as $item) echo $navLink($item); ?>

        <?php if ($role === 'student'): ?>
          <div class="mt-2 mb-1 border-t border-[#E8EDF0]"></div>
          <p class="text-[10px] font-bold uppercase tracking-widest px-3 py-1" style="color: #9BB5C0">Quick Actions</p>
          <button type="button"<?= toastAttrs('Check with the librarian at the front desk!', 'info') ?> class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left w-full text-[#264653] hover:bg-[#F0F4F6]">
            <span>❓</span> Ask Librarian
          </button>
        <?php elseif ($role === 'librarian'): ?>
          <div class="mt-2 mb-1 border-t border-[#E8EDF0]"></div>
          <button type="button"<?= toastAttrs('Opening help documentation…', 'info') ?> class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#264653] hover:bg-[#F0F4F6] transition-all text-left w-full">
            <span>📦</span> Pending Requests
            <span class="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full bg-[#FFF3E8] text-[#F4A261]">2</span>
          </button>
        <?php endif; ?>
      </nav>
      <div class="p-4 border-t border-[#E8EDF0]">
        <div class="flex items-center gap-2 px-1">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style="background-color: <?= $accent ?>"><?= e(initials($user['name'])) ?></div>
          <div class="min-w-0">
            <p class="text-xs font-bold text-[#264653] truncate"><?= e($user['name']) ?></p>
            <p class="text-[10px] text-[#9BB5C0] capitalize"><?= e($role) ?></p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile sidebar -->
    <div id="mobile-sidebar" hidden>
      <div class="fixed inset-0 z-30 md:hidden" style="background-color: rgba(38, 70, 83, 0.3); top: 64px" data-toggle="#mobile-sidebar"></div>
      <div class="fixed left-0 z-40 md:hidden bg-white border-r border-[#E8EDF0] flex flex-col" style="top: 64px; bottom: 0; width: 220px">
        <nav class="p-3 flex flex-col gap-1 flex-1 overflow-y-auto">
          <?php foreach ($navItems as $item) echo $navLink($item); ?>
        </nav>
      </div>
    </div>

    <main class="flex-1 min-w-0 overflow-x-hidden pb-20 md:pb-6">
      <?= $content ?>
    </main>
  </div>

  <!-- Mobile bottom tab bar -->
  <nav class="fixed bottom-0 left-0 right-0 md:hidden z-40 border-t border-[#E8EDF0] flex" style="background-color: #FDFBF7; padding-bottom: env(safe-area-inset-bottom)">
    <?php foreach ($navItems as $item): $isActive = $item['key'] === $active; ?>
      <a href="<?= e($item['href']) ?>" class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all" style="color: <?= $isActive ? $accent : '#9BB5C0' ?>">
        <span class="text-xl"><?= $item['emoji'] ?></span>
        <span class="text-[10px] font-semibold"><?= e($item['label']) ?></span>
      </a>
    <?php endforeach; ?>
  </nav>

  <?php require __DIR__.'/partials/toasts.php'; ?>
</div>
</body>
</html>
