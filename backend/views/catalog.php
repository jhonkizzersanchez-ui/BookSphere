<?php
/**
 * Book catalog (ported from BookCatalog.tsx).
 * Query: ?q=text (title/author/genre) &genre[]=Fantasy &level[]=Grades 6-8 &available=1
 *        &sort=rating|title|newest (default rating) &filters=0 (collapse the desktop filter sidebar)
 * @var array $user
 */
$sortOptions = ['rating' => 'Top Rated', 'title' => 'A–Z', 'newest' => 'Newest'];
$search = queryString('q');
$selectedGenres = array_values(array_intersect(array_unique(queryList('genre')), allGenres()));
$selectedLevels = array_values(array_intersect(array_unique(queryList('level')), READING_LEVELS));
$availableOnly = queryString('available') === '1';
$sortBy = isset($sortOptions[queryString('sort')]) ? queryString('sort') : 'rating';
$sidebarOpen = queryString('filters') !== '0';

$needle = mb_strtolower($search);
$filtered = array_values(array_filter(books(), function (array $book) use ($needle, $selectedGenres, $selectedLevels, $availableOnly): bool {
    if ($needle !== ''
        && ! str_contains(mb_strtolower($book['title']), $needle)
        && ! str_contains(mb_strtolower($book['author']), $needle)
        && ! array_filter($book['genre'], fn ($genre) => str_contains(mb_strtolower($genre), $needle))) {
        return false;
    }
    if ($selectedGenres && ! array_intersect($book['genre'], $selectedGenres)) {
        return false;
    }
    if ($selectedLevels && ! in_array($book['readingLevel'], $selectedLevels, true)) {
        return false;
    }
    return ! $availableOnly || isAvailable($book);
}));
usort($filtered, match ($sortBy) {
    'title' => fn ($a, $b) => strcasecmp($a['title'], $b['title']),
    'newest' => fn ($a, $b) => $b['yearPublished'] <=> $a['yearPublished'],
    default => fn ($a, $b) => $b['rating'] <=> $a['rating'],
});
$activeFilters = count($selectedGenres) + count($selectedLevels) + ($availableOnly ? 1 : 0);

/* Hidden inputs that carry the current state into the GET forms, minus the field the form itself edits. */
$state = [
    'q' => $search,
    'genre' => $selectedGenres,
    'level' => $selectedLevels,
    'available' => $availableOnly ? '1' : '',
    'sort' => $sortBy === 'rating' ? '' : $sortBy,
    'filters' => $sidebarOpen ? '' : '0',
];
$hiddenInputs = function (string $except) use ($state): string {
    $html = '';
    foreach ($state as $name => $value) {
        if ($name === $except) {
            continue;
        }
        foreach (is_array($value) ? $value : [$value] as $item) {
            if ($item !== '') {
                $html .= '<input type="hidden" name="'.e(is_array($value) ? $name.'[]' : $name).'" value="'.e($item).'">';
            }
        }
    }
    return $html;
};
/* Filter links: the current URL with $changes applied and the genre/level lists normalised. */
$linkWith = fn (array $changes): string => queryWith($changes + ['genre' => $selectedGenres, 'level' => $selectedLevels]);
$chipClass = 'flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium transition-all hover:opacity-80';
?>
<div class="flex h-full min-h-screen">
  <!-- Sidebar -->
  <aside class="flex-shrink-0 border-r border-[#E8EDF0] bg-white transition-all duration-200 overflow-y-auto <?= $sidebarOpen ? 'w-56' : 'w-0 overflow-hidden' ?> hidden md:block"<?= $sidebarOpen ? '' : ' inert' ?>
    style="position: sticky; top: 0; max-height: calc(100vh - 64px); align-self: flex-start">
    <div class="p-4 space-y-5">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wide" style="color: #6B8EA0">Filters</span>
        <?php if ($activeFilters > 0): ?>
          <a href="<?= e($linkWith(['genre' => null, 'level' => null, 'available' => null])) ?>" class="text-xs font-semibold" style="color: #E76F51">Clear all</a>
        <?php endif; ?>
      </div>

      <!-- Availability -->
      <form action="<?= e(url('catalog')) ?>" method="get">
        <?= $hiddenInputs('available') ?>
        <p class="text-xs font-semibold mb-2" style="color: #264653">Availability</p>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="available" value="1"<?= $availableOnly ? ' checked' : '' ?> data-autosubmit class="w-4 h-4 accent-[#2A9D8F] rounded">
          <span class="text-sm text-[#264653]">Available now</span>
        </label>
      </form>

      <!-- Reading Level -->
      <div>
        <p class="text-xs font-semibold mb-2" style="color: #264653">Reading Level</p>
        <div class="space-y-1.5">
          <?php foreach (READING_LEVELS as $level): $lvl = levelColors($level); $active = in_array($level, $selectedLevels, true); ?>
            <a href="<?= e($linkWith(['level' => toggleItem($selectedLevels, $level)])) ?>" class="block w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style="background-color: <?= e($active ? $lvl['bg'] : 'transparent') ?>; color: <?= e($active ? $lvl['text'] : '#264653') ?>; border: 1px solid <?= e($active ? $lvl['border'] : 'transparent') ?>"><?= e($level) ?></a>
          <?php endforeach; ?>
        </div>
      </div>

      <!-- Genre -->
      <div>
        <p class="text-xs font-semibold mb-2" style="color: #264653">Genre</p>
        <div class="space-y-1">
          <?php foreach (allGenres() as $genre): $active = in_array($genre, $selectedGenres, true); $color = genreColor($genre); ?>
            <a href="<?= e($linkWith(['genre' => toggleItem($selectedGenres, $genre)])) ?>" class="w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs transition-all"
              style="background-color: <?= e($active ? $color.'18' : 'transparent') ?>; color: <?= e($active ? $color : '#264653') ?>">
              <span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: <?= e($color) ?>"></span>
              <?= e($genre) ?>
            </a>
          <?php endforeach; ?>
        </div>
      </div>
    </div>
  </aside>

  <!-- Main content -->
  <div class="flex-1 min-w-0 px-4 md:px-6 py-5 space-y-4">
    <!-- Top bar -->
    <div class="flex flex-wrap gap-3 items-center justify-between">
      <div class="flex items-center gap-2">
        <a href="<?= e($linkWith(['filters' => $sidebarOpen ? '0' : null])) ?>" class="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E8EDF0] text-sm font-medium transition-colors hover:bg-[#F0F4F6]" style="color: #264653">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Filters <?php if ($activeFilters > 0): ?><span class="ml-1 bg-[#2A9D8F] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"><?= $activeFilters ?></span><?php endif; ?>
        </a>
        <h1 class="text-xl font-bold" style="<?= BALOO ?> color: #264653">
          Book Catalog
        </h1>
        <span class="text-sm text-[#6B8EA0]">(<?= count($filtered) ?> books)</span>
      </div>
      <form action="<?= e(url('catalog')) ?>" method="get" class="flex items-center gap-2">
        <?= $hiddenInputs('sort') ?>
        <span class="text-xs text-[#6B8EA0] hidden sm:block">Sort:</span>
        <select name="sort" data-autosubmit aria-label="Sort books"
          class="text-sm px-3 py-1.5 rounded-lg border border-[#E8EDF0] bg-white text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/30">
          <?php foreach ($sortOptions as $value => $label): ?>
            <option value="<?= e($value) ?>"<?= $sortBy === $value ? ' selected' : '' ?>><?= e($label) ?></option>
          <?php endforeach; ?>
        </select>
      </form>
    </div>

    <!-- Active filter chips -->
    <?php if ($activeFilters > 0): ?>
      <div class="flex flex-wrap gap-2">
        <?php foreach ($selectedLevels as $level): $lvl = levelColors($level); ?>
          <a href="<?= e($linkWith(['level' => toggleItem($selectedLevels, $level)])) ?>" class="<?= $chipClass ?>"
            style="background-color: <?= e($lvl['bg']) ?>; color: <?= e($lvl['text']) ?>; border: 1px solid <?= e($lvl['border']) ?>"><?= e($level) ?> ✕</a>
        <?php endforeach; ?>
        <?php foreach ($selectedGenres as $genre): $color = genreColor($genre); ?>
          <a href="<?= e($linkWith(['genre' => toggleItem($selectedGenres, $genre)])) ?>" class="<?= $chipClass ?>"
            style="background-color: <?= e($color) ?>18; color: <?= e($color) ?>; border: 1px solid <?= e($color) ?>40"><?= e($genre) ?> ✕</a>
        <?php endforeach; ?>
        <?php if ($availableOnly): ?>
          <a href="<?= e($linkWith(['available' => null])) ?>" class="<?= $chipClass ?>"
            style="background-color: #E8F5F3; color: #2A9D8F; border: 1px solid #A8DAD7">Available now ✕</a>
        <?php endif; ?>
      </div>
    <?php endif; ?>

    <!-- Mobile search -->
    <form action="<?= e(url('catalog')) ?>" method="get" class="md:hidden relative" role="search">
      <?= $hiddenInputs('q') ?>
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="6.5" cy="6.5" r="5" stroke="#6B8EA0" stroke-width="1.5"/>
        <path d="M10.5 10.5L14 14" stroke="#6B8EA0" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <input type="text" name="q" value="<?= e($search) ?>" aria-label="Search books" placeholder="Search books…"
        class="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E8EDF0] bg-white text-sm text-[#264653] focus:outline-none">
    </form>

    <!-- Grid -->
    <?php if (! $filtered): ?>
      <div class="text-center py-20">
        <p class="text-5xl mb-4">🔍</p>
        <p class="text-lg font-bold text-[#264653]" style="<?= BALOO ?>">No books found</p>
        <p class="text-sm text-[#6B8EA0] mt-1">Try adjusting your filters or search</p>
      </div>
    <?php else: ?>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <?php foreach ($filtered as $book): $available = isAvailable($book); ?>
          <a href="<?= e(url('books/'.$book['id'])) ?>" class="bg-white rounded-2xl p-3 border border-[#E8EDF0] cursor-pointer hover:shadow-lg transition-all hover:border-[#2A9D8F]/30 hover:-translate-y-0.5 flex flex-col gap-2">
            <div class="relative">
              <?= bookCover($book, 'md', 'w-full') ?>
              <div class="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style="background-color: <?= $available ? '#E8F5F3' : '#F5F7F8' ?>; color: <?= $available ? '#1E7268' : '#9BB5C0' ?>"><?= $available ? e(($book['totalCopies'] - $book['borrowedCopies']).' avail.') : 'All out' ?></div>
            </div>
            <div>
              <p class="text-sm font-bold text-[#264653] leading-tight line-clamp-2" style="<?= BALOO ?>"><?= e($book['title']) ?></p>
              <p class="text-xs text-[#6B8EA0] mt-0.5 truncate"><?= e($book['author']) ?></p>
              <div class="flex items-center justify-between mt-1.5">
                <?= ratingBadge($book['rating']) ?>
                <?= levelBadge($book['readingLevel']) ?>
              </div>
              <div class="flex flex-wrap gap-1 mt-1.5">
                <?php foreach (array_slice($book['genre'], 0, 2) as $genre) echo genreTag($genre); ?>
              </div>
              <?php if (isset($book['arPoints'])): ?>
                <div class="flex flex-wrap gap-1 mt-1.5">
                  <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style="background-color: #FFF3E8; color: #B5651D">AR <?= e($book['arPoints']) ?> pts</span>
                  <?php if (isset($book['lexile'])): ?>
                    <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style="background-color: #EAF0FF; color: #3A4FBF"><?= e($book['lexile']) ?>L</span>
                  <?php endif; ?>
                </div>
              <?php endif; ?>
            </div>
          </a>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>
</div>
