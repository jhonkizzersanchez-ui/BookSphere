<?php
/**
 * Search results (ported from SearchResults.tsx).
 * Query: ?q=text (title/author/genre/synopsis) &genre=Fantasy &level=Grades 6-8 &available=1
 * @var array $user
 */
$query = queryString('q');
$genreFilter = in_array(queryString('genre'), allGenres(), true) ? queryString('genre') : null;
$levelFilter = in_array(queryString('level'), READING_LEVELS, true) ? queryString('level') : null;
$availableOnly = queryString('available') === '1';

$needle = mb_strtolower($query);
$results = array_values(array_filter(books(), function (array $book) use ($needle, $genreFilter, $levelFilter, $availableOnly): bool {
    $matchesQuery = $needle === ''
        || str_contains(mb_strtolower($book['title']), $needle)
        || str_contains(mb_strtolower($book['author']), $needle)
        || array_filter($book['genre'], fn ($genre) => str_contains(mb_strtolower($genre), $needle))
        || str_contains(mb_strtolower($book['synopsis']), $needle);
    $matchesGenre = $genreFilter === null || in_array($genreFilter, $book['genre'], true);
    $matchesLevel = $levelFilter === null || $book['readingLevel'] === $levelFilter;
    $matchesAvail = ! $availableOnly || isAvailable($book);
    return $matchesQuery && $matchesGenre && $matchesLevel && $matchesAvail;
}));
$count = count($results);

$activeGenres = array_slice(array_values(array_unique(array_merge(...array_column($results, 'genre')))), 0, 8);
$hasFilters = $genreFilter !== null || $levelFilter !== null || $availableOnly;
$chipClass = 'text-xs font-semibold px-3 py-1.5 rounded-full border transition-all';
?>
<div class="max-w-5xl mx-auto px-4 py-6">
  <!-- Search bar (a new search keeps the active filters, as the React screen did) -->
  <form action="<?= e(url('search')) ?>" method="get" class="relative mb-6" role="search">
    <?php if ($genreFilter !== null): ?><input type="hidden" name="genre" value="<?= e($genreFilter) ?>"><?php endif; ?>
    <?php if ($levelFilter !== null): ?><input type="hidden" name="level" value="<?= e($levelFilter) ?>"><?php endif; ?>
    <?php if ($availableOnly): ?><input type="hidden" name="available" value="1"><?php endif; ?>
    <svg class="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
      <circle cx="6.5" cy="6.5" r="5" stroke="#6B8EA0" stroke-width="1.5"/>
      <path d="M10.5 10.5L14 14" stroke="#6B8EA0" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <input type="text" id="search-page-input" name="q" value="<?= e($query) ?>" required aria-label="Search books" placeholder="Search books, authors, genres…"
      class="w-full pl-12 pr-12 py-3 rounded-2xl border-2 border-[#2A9D8F]/30 bg-white text-[#264653] text-base focus:outline-none focus:border-[#2A9D8F] transition-all shadow-sm">
    <button type="button" data-clear="#search-page-input"<?= $query === '' ? ' hidden' : '' ?> aria-label="Clear search"
      class="absolute right-4 top-1/2 -translate-y-1/2 text-[#9BB5C0] hover:text-[#264653]">✕</button>
  </form>

  <!-- Results header -->
  <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
    <div>
      <h1 class="text-xl font-bold" style="<?= BALOO ?> color: #264653">
        <?php if ($query !== ''): ?>Results for <span style="color: #2A9D8F">"<?= e($query) ?>"</span><?php else: ?>All Books<?php endif; ?>
      </h1>
      <p class="text-sm text-[#6B8EA0]"><?= $count ?> book<?= $count !== 1 ? 's' : '' ?> found</p>
    </div>
    <?php if ($hasFilters): ?>
      <a href="<?= e(queryWith(['genre' => null, 'level' => null, 'available' => null])) ?>"
        class="text-xs font-semibold px-3 py-1.5 rounded-lg text-[#E76F51] bg-[#FEF0EE] hover:bg-[#FDE0DA] transition-colors">Clear all filters</a>
    <?php endif; ?>
  </div>

  <!-- Filter chips -->
  <div class="flex flex-wrap gap-2 mb-5">
    <!-- Availability -->
    <a href="<?= e(queryWith(['available' => $availableOnly ? null : '1'])) ?>" class="<?= $chipClass ?>"
      style="background-color: <?= $availableOnly ? '#E8F5F3' : 'white' ?>; border-color: <?= $availableOnly ? '#2A9D8F' : '#E8EDF0' ?>; color: <?= $availableOnly ? '#2A9D8F' : '#264653' ?>"><?= $availableOnly ? '✓ Available now' : 'Available now' ?></a>

    <!-- Level chips -->
    <?php foreach (READING_LEVELS as $level): $lvl = levelColors($level); $active = $levelFilter === $level; ?>
      <a href="<?= e(queryWith(['level' => $active ? null : $level])) ?>" class="<?= $chipClass ?>"
        style="background-color: <?= e($active ? $lvl['bg'] : 'white') ?>; border-color: <?= e($active ? $lvl['border'] : '#E8EDF0') ?>; color: <?= e($active ? $lvl['text'] : '#264653') ?>"><?= $active ? '✓ ' : '' ?><?= e(shortLevel($level)) ?></a>
    <?php endforeach; ?>

    <!-- Genre chips -->
    <?php foreach ($activeGenres as $genre): $color = genreColor($genre); $active = $genreFilter === $genre; ?>
      <a href="<?= e(queryWith(['genre' => $active ? null : $genre])) ?>" class="<?= $chipClass ?>"
        style="background-color: <?= e($active ? $color.'18' : 'white') ?>; border-color: <?= e($active ? $color.'60' : '#E8EDF0') ?>; color: <?= e($active ? $color : '#264653') ?>"><?= $active ? '✓ ' : '' ?><?= e($genre) ?></a>
    <?php endforeach; ?>
  </div>

  <!-- Results -->
  <?php if ($count === 0): ?>
    <div class="text-center py-20 bg-white rounded-2xl border border-[#E8EDF0]">
      <p class="text-6xl mb-4">🔍</p>
      <h3 class="text-xl font-bold text-[#264653] mb-2" style="<?= BALOO ?>">
        No books found
      </h3>
      <p class="text-sm text-[#6B8EA0] mb-4">
        We could not find any books matching <strong>"<?= e($query) ?>"</strong>
      </p>
      <div class="space-y-1 text-sm text-[#6B8EA0] mb-6">
        <p>Suggestions:</p>
        <p>• Check for spelling errors</p>
        <p>• Try a genre, author name, or keyword</p>
        <p>• Ask the librarian for help</p>
      </div>
      <a href="<?= e(url('catalog')) ?>" class="inline-block px-6 py-2.5 rounded-xl font-bold text-sm text-white" style="background-color: #2A9D8F">
        Browse Full Catalog
      </a>
    </div>
  <?php else: ?>
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <?php foreach ($results as $book):
          $available = isAvailable($book);
          $highlightTitle = str_contains(mb_strtolower($book['title']), $needle);
      ?>
        <div class="relative bg-white rounded-2xl p-3 border border-[#E8EDF0] cursor-pointer hover:shadow-lg transition-all hover:border-[#2A9D8F]/30 hover:-translate-y-0.5 flex flex-col gap-2">
          <div class="relative">
            <?= bookCover($book, 'md', 'w-full') ?>
            <?php if (! $available): ?>
              <div class="absolute inset-0 rounded-lg bg-black/20 flex items-end justify-center pb-2">
                <span class="text-[9px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-full">All Copies Out</span>
              </div>
            <?php endif; ?>
          </div>
          <div>
            <p class="text-sm font-bold leading-tight line-clamp-2" style="<?= BALOO ?> color: <?= $highlightTitle ? '#2A9D8F' : '#264653' ?>">
              <a href="<?= e(url('books/'.$book['id'])) ?>" class="after:absolute after:inset-0"><?= e($book['title']) ?></a>
            </p>
            <p class="text-xs text-[#6B8EA0] mt-0.5 truncate"><?= e($book['author']) ?></p>
            <div class="flex items-center justify-between mt-1.5">
              <div class="flex items-center gap-0.5">
                <span class="text-xs" style="color: #F9C74F">★</span>
                <span class="text-xs font-semibold text-[#264653]"><?= number_format($book['rating'], 1) ?></span>
              </div>
              <?= levelBadge($book['readingLevel']) ?>
            </div>
            <div class="flex flex-wrap gap-1 mt-1.5">
              <?php foreach (array_slice($book['genre'], 0, 2) as $genre): $color = genreColor($genre); ?>
                <a href="<?= e(queryWith(['genre' => $genre])) ?>" class="relative z-10 text-[9px] font-medium px-1.5 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                  style="background-color: <?= e($color) ?>18; color: <?= e($color) ?>"><?= e($genre) ?></a>
              <?php endforeach; ?>
            </div>
          </div>
        </div>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>
</div>
