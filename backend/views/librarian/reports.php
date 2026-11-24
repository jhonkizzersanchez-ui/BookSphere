<?php
/**
 * Librarian panel: Library Reports section. Included by librarian-panel.php.
 * @var array $allBooks @var array $overdueStudents
 */
$popularBooks = $allBooks;
usort($popularBooks, fn (array $a, array $b) => $b['reviewCount'] <=> $a['reviewCount']);
$popularBooks = array_slice($popularBooks, 0, 5);

$genrePopularity = [
    ['genre' => 'Fantasy', 'pct' => 82],
    ['genre' => 'Adventure', 'pct' => 74],
    ['genre' => 'Science Fiction', 'pct' => 68],
    ['genre' => 'Realistic Fiction', 'pct' => 55],
    ['genre' => 'Comedy', 'pct' => 42],
];
?>
<div class="space-y-5">
  <div class="flex items-center justify-between flex-wrap gap-3">
    <h1 class="text-2xl font-bold" style="<?= BALOO ?> color: #264653">Library Reports</h1>
    <button type="button"<?= toastAttrs('Full report exported!', 'success') ?> class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-[#E8EDF0] bg-white text-[#264653] hover:bg-[#F0F4F6]">
      📊 Export All
    </button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
    <!-- Most popular books -->
    <div class="bg-white rounded-2xl border border-[#E8EDF0] p-5">
      <h3 class="font-bold mb-4" style="<?= BALOO ?> color: #264653">Most Popular Books</h3>
      <div class="space-y-3">
        <?php foreach ($popularBooks as $i => $book): $pct = ($book['reviewCount'] / 234) * 100; ?>
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold w-4 text-[#9BB5C0]"><?= e($i + 1) ?></span>
            <?= bookCover($book, 'xs') ?>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-[#264653] truncate"><?= e($book['title']) ?></p>
              <div class="flex items-center gap-2 mt-0.5">
                <div class="flex-1 h-1.5 bg-[#E8EDF0] rounded-full overflow-hidden">
                  <div class="h-full rounded-full" style="width: <?= e($pct) ?>%; background-color: #9B5DE5"></div>
                </div>
                <span class="text-[10px] text-[#6B8EA0] flex-shrink-0"><?= e($book['reviewCount']) ?> reviews</span>
              </div>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>

    <!-- Reading level distribution -->
    <div class="bg-white rounded-2xl border border-[#E8EDF0] p-5">
      <h3 class="font-bold mb-4" style="<?= BALOO ?> color: #264653">Collection by Reading Level</h3>
      <div class="space-y-3">
        <?php foreach (READING_LEVELS as $level):
            $count = count(array_filter($allBooks, fn (array $book) => $book['readingLevel'] === $level));
            $pct = $allBooks ? ($count / count($allBooks)) * 100 : 0;
            $lvl = levelColors($level);
        ?>
          <div class="space-y-1">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-[#264653]"><?= e($level) ?></span>
              <span class="font-bold" style="color: <?= e($lvl['text']) ?>"><?= e($count) ?> books (<?= e((int) round($pct)) ?>%)</span>
            </div>
            <div class="h-2 bg-[#E8EDF0] rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all" style="width: <?= e($pct) ?>%; background-color: <?= e($lvl['text']) ?>"></div>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </div>

    <!-- Overdue by student -->
    <div class="bg-white rounded-2xl border border-[#E8EDF0] p-5">
      <h3 class="font-bold mb-4" style="<?= BALOO ?> color: #264653">Overdue Books by Student</h3>
      <?php if (! $overdueStudents): ?>
        <div class="text-center py-6">
          <p class="text-3xl mb-2">🎉</p>
          <p class="text-sm font-semibold text-[#2D7A50]">No overdue books!</p>
        </div>
      <?php else: ?>
        <div class="space-y-2">
          <?php foreach ($overdueStudents as $student): ?>
            <div class="flex items-center justify-between py-2 border-b border-[#F0F4F6]">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-[#E76F51]">
                  <?= e(mb_substr($student['name'], 0, 1)) ?>
                </div>
                <span class="text-sm text-[#264653]"><?= e($student['name']) ?></span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FEF0EE] text-[#E76F51]">
                  <?= e($student['overdueCount']) ?> overdue
                </span>
                <button type="button"<?= toastAttrs('Reminder sent to '.$student['name'].'!', 'success') ?> class="text-xs font-semibold text-[#9B5DE5] hover:underline">
                  Remind
                </button>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>

    <!-- Genre popularity -->
    <div class="bg-white rounded-2xl border border-[#E8EDF0] p-5">
      <h3 class="font-bold mb-4" style="<?= BALOO ?> color: #264653">Genre Popularity</h3>
      <div class="space-y-2">
        <?php foreach ($genrePopularity as $row): ?>
          <div class="flex items-center gap-3">
            <span class="text-xs font-medium text-[#264653] w-28 flex-shrink-0"><?= e($row['genre']) ?></span>
            <div class="flex-1 h-2 bg-[#E8EDF0] rounded-full overflow-hidden">
              <div class="h-full rounded-full" style="width: <?= e($row['pct']) ?>%; background-color: #2A9D8F"></div>
            </div>
            <span class="text-xs font-semibold text-[#6B8EA0] w-8 text-right"><?= e($row['pct']) ?>%</span>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</div>
