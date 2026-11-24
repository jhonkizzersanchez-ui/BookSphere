<?php
/**
 * Student dashboard (ported from src/screens/StudentDashboard.tsx).
 * @var array $user
 */
$student = currentStudent();
$borrowed = withBooks($student['borrowedBooks']);
$borrowedIds = array_column($student['borrowedBooks'], 'bookId');
$recommended = array_slice(array_values(array_filter(
    books(),
    fn ($book) => $book['readingLevel'] === $student['readingLevel'] && ! in_array($book['id'], $borrowedIds, true)
)), 0, 6);
$earnedBadges = array_filter($student['badges'], fn ($badge) => $badge['earned']);
$wishlistPeek = array_filter(array_map('findBook', array_slice($student['wishlist'], 0, 3)));
$firstName = explode(' ', $user['name'])[0];
$stats = [
    ['label' => 'Books Read', 'value' => $student['booksReadThisYear'], 'sub' => 'this school year', 'emoji' => '📗', 'color' => '#2A9D8F'],
    ['label' => 'Reading Streak', 'value' => $student['readingStreak'], 'sub' => 'days in a row', 'emoji' => '🔥', 'color' => '#E76F51'],
    ['label' => 'Badges Earned', 'value' => count($earnedBadges), 'sub' => 'of '.count($student['badges']).' total', 'emoji' => '🏅', 'color' => '#F4A261'],
    ['label' => 'Books Borrowed', 'value' => count($borrowed), 'sub' => 'currently reading', 'emoji' => '📌', 'color' => '#4361EE'],
];
?>
<div class="max-w-6xl mx-auto px-4 py-6 space-y-6">
  <!-- Welcome banner -->
  <div class="rounded-2xl p-6 relative overflow-hidden" style="background: linear-gradient(135deg, #2A9D8F 0%, #1E7268 100%)">
    <div class="absolute right-0 top-0 bottom-0 w-32 opacity-10 flex items-center justify-end pr-4">
      <span class="text-9xl">📚</span>
    </div>
    <div class="relative">
      <p class="text-white/70 text-sm font-medium mb-1"><?= e(fmtDate(DEMO_TODAY, 'l, F j')) ?></p>
      <h1 class="text-2xl font-bold text-white mb-1" style="<?= BALOO ?>">
        Hi, <?= e($firstName) ?>! Ready to read? 📖
      </h1>
      <p class="text-white/80 text-sm">Grade 7 · <?= e($student['class']) ?> · Reading Level: Grades 6–8</p>
    </div>
  </div>

  <!-- Stats row -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <?php foreach ($stats as $stat): ?>
      <div class="bg-white rounded-2xl p-4 border border-[#E8EDF0] flex flex-col gap-1">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium" style="color: #6B8EA0"><?= e($stat['label']) ?></span>
          <span class="text-lg"><?= $stat['emoji'] ?></span>
        </div>
        <p class="text-3xl font-bold" style="color: <?= $stat['color'] ?>; <?= BALOO ?>"><?= e($stat['value']) ?></p>
        <p class="text-xs" style="color: #9BB5C0"><?= e($stat['sub']) ?></p>
      </div>
    <?php endforeach; ?>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Currently borrowed -->
    <div class="lg:col-span-2 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold" style="<?= BALOO ?> color: #264653">
          Currently Borrowed
        </h2>
        <a href="<?= e(url('my-books')) ?>" class="text-xs font-semibold" style="color: #2A9D8F">View all →</a>
      </div>

      <?php if (! $borrowed): ?>
        <div class="bg-white rounded-2xl p-10 border border-[#E8EDF0] text-center">
          <p class="text-4xl mb-3">📭</p>
          <p class="font-semibold text-[#264653]">No books borrowed yet</p>
          <p class="text-sm text-[#6B8EA0] mt-1">Head to the catalog to find your next read!</p>
          <a href="<?= e(url('catalog')) ?>" class="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white" style="background-color: #2A9D8F">
            Browse Catalog
          </a>
        </div>
      <?php else: ?>
        <div class="space-y-3">
          <?php foreach ($borrowed as ['record' => $record, 'book' => $book]):
              $diff = daysUntil($record['dueDate']);
              $progressPct = max(0, min(100, ((14 - $diff) / 14) * 100));
              $barColor = $diff <= 3 ? '#E76F51' : ($diff <= 7 ? '#F4A261' : '#2A9D8F');
              if ($diff < 0) {
                  [$badgeBg, $badgeColor, $badgeText] = ['#FEF0EE', '#E76F51', 'Overdue'];
              } elseif ($diff <= 3) {
                  [$badgeBg, $badgeColor, $badgeText] = ['#FFF8E0', '#C49A00', 'Due in '.$diff.'d ⚠️'];
              } else {
                  [$badgeBg, $badgeColor, $badgeText] = ['#E8F8F0', '#2D7A50', 'Due '.($diff > 14 ? $record['dueDate'] : 'in '.$diff.'d')];
              }
          ?>
            <a href="<?= e(url('books/'.$book['id'])) ?>" class="bg-white rounded-2xl p-4 border border-[#E8EDF0] flex gap-4 cursor-pointer hover:shadow-md transition-all hover:border-[#2A9D8F]/30">
              <?= bookCover($book, 'sm') ?>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-[#264653] text-sm leading-tight mb-0.5 truncate" style="<?= BALOO ?>">
                  <?= e($book['title']) ?>
                </h3>
                <p class="text-xs text-[#6B8EA0] mb-2"><?= e($book['author']) ?></p>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full" style="background-color: <?= $badgeBg ?>; color: <?= $badgeColor ?>"><?= e($badgeText) ?></span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-1.5 bg-[#E8EDF0] rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all" style="width: <?= $progressPct ?>%; background-color: <?= $barColor ?>"></div>
                  </div>
                  <span class="text-xs text-[#6B8EA0] flex-shrink-0">
                    Due <?= e(fmtDate($record['dueDate'])) ?>
                  </span>
                </div>
              </div>
            </a>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>

      <!-- Recommended -->
      <div class="flex items-center justify-between mt-2">
        <h2 class="text-lg font-bold" style="<?= BALOO ?> color: #264653">
          Recommended for You ✨
        </h2>
        <a href="<?= e(url('catalog')) ?>" class="text-xs font-semibold" style="color: #2A9D8F">See all →</a>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <?php foreach ($recommended as $book): ?>
          <a href="<?= e(url('books/'.$book['id'])) ?>" class="bg-white rounded-2xl p-3 border border-[#E8EDF0] cursor-pointer hover:shadow-md transition-all hover:border-[#2A9D8F]/30 flex flex-col gap-2">
            <?= bookCover($book, 'md', 'w-full') ?>
            <div>
              <p class="text-sm font-bold text-[#264653] leading-tight line-clamp-2" style="<?= BALOO ?>"><?= e($book['title']) ?></p>
              <p class="text-xs text-[#6B8EA0] mt-0.5"><?= e($book['author']) ?></p>
              <div class="flex items-center justify-between mt-1.5">
                <?= stars($book['rating']) ?>
                <?= levelBadge($book['readingLevel'], true, 'text-[10px] font-semibold px-1.5 py-0.5') ?>
              </div>
            </div>
          </a>
        <?php endforeach; ?>
      </div>
    </div>

    <!-- Right sidebar -->
    <div class="space-y-4">
      <!-- Achievements -->
      <div class="bg-white rounded-2xl p-4 border border-[#E8EDF0]">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-sm" style="<?= BALOO ?> color: #264653">My Badges</h3>
          <a href="<?= e(url('my-books')) ?>" class="text-xs font-semibold" style="color: #2A9D8F">All →</a>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <?php foreach ($student['badges'] as $badge): ?>
            <div class="flex flex-col items-center gap-1 p-2 rounded-xl transition-all" style="background-color: <?= $badge['earned'] ? '#FFF8E0' : '#F5F7F8' ?>; opacity: <?= $badge['earned'] ? '1' : '0.5' ?>" title="<?= e($badge['description']) ?>">
              <span class="text-2xl"><?= e($badge['emoji']) ?></span>
              <span class="text-[9px] font-semibold text-center leading-tight" style="color: <?= $badge['earned'] ? '#264653' : '#9BB5C0' ?>">
                <?= e($badge['name']) ?>
              </span>
            </div>
          <?php endforeach; ?>
        </div>
      </div>

      <!-- Reading progress -->
      <div class="bg-white rounded-2xl p-4 border border-[#E8EDF0]">
        <h3 class="font-bold text-sm mb-3" style="<?= BALOO ?> color: #264653">Year Goal</h3>
        <div class="relative flex items-center justify-center mb-3">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#E8EDF0" stroke-width="10" />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="#2A9D8F"
              stroke-width="10"
              stroke-linecap="round"
              stroke-dasharray="<?= ($student['booksReadThisYear'] / 20) * 251.2 ?> 251.2"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div class="absolute text-center">
            <p class="text-2xl font-bold" style="color: #264653; <?= BALOO ?>"><?= e($student['booksReadThisYear']) ?></p>
            <p class="text-[10px] text-[#6B8EA0]">of 20</p>
          </div>
        </div>
        <p class="text-xs text-center" style="color: #6B8EA0">
          <?= 20 - $student['booksReadThisYear'] ?> books to reach your goal!
        </p>
      </div>

      <!-- Wishlist peek -->
      <div class="bg-white rounded-2xl p-4 border border-[#E8EDF0]">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-sm" style="<?= BALOO ?> color: #264653">Wishlist</h3>
          <a href="<?= e(url('my-books')) ?>" class="text-xs font-semibold" style="color: #2A9D8F">View →</a>
        </div>
        <div class="space-y-2">
          <?php foreach ($wishlistPeek as $book): ?>
            <a href="<?= e(url('books/'.$book['id'])) ?>" class="flex gap-2 items-center cursor-pointer hover:bg-[#F5F7F8] rounded-lg p-1 transition-colors">
              <?= bookCover($book, 'xs') ?>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-[#264653] truncate"><?= e($book['title']) ?></p>
                <p class="text-[10px] text-[#6B8EA0]"><?= e($book['author']) ?></p>
              </div>
              <span class="text-[#F4A261] text-sm flex-shrink-0">🔖</span>
            </a>
          <?php endforeach; ?>
        </div>
      </div>
    </div>
  </div>
</div>
