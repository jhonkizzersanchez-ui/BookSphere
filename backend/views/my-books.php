<?php
/**
 * Student "My Books" page (ported from src/screens/MyBooks.tsx).
 * The active tab comes from ?tab=borrowed|history|wishlist (default borrowed).
 * @var array $user
 */
$student = currentStudent();
$borrowed = withBooks($student['borrowedBooks']);
$history = withBooks($student['readingHistory']);
$wishlist = array_values(array_filter(array_map('findBook', $student['wishlist'])));
$tabs = [
    ['id' => 'borrowed', 'label' => 'Currently Borrowed', 'count' => count($borrowed)],
    ['id' => 'history', 'label' => 'Reading History', 'count' => count($history)],
    ['id' => 'wishlist', 'label' => 'Wishlist', 'count' => count($wishlist)],
];
$activeTab = queryString('tab', 'borrowed');
if (! in_array($activeTab, array_column($tabs, 'id'), true)) {
    $activeTab = 'borrowed';
}
?>
<div class="max-w-4xl mx-auto px-4 py-6">
  <h1 class="text-2xl font-bold mb-6" style="<?= BALOO ?> color: #264653">
    My Books
  </h1>

  <!-- Achievement summary -->
  <div class="bg-white rounded-2xl border border-[#E8EDF0] p-4 mb-6 overflow-x-auto">
    <div class="flex items-center gap-4 min-w-max">
      <div class="text-center px-4 border-r border-[#E8EDF0]">
        <p class="text-2xl font-bold" style="<?= BALOO ?> color: #2A9D8F"><?= e($student['booksReadThisYear']) ?></p>
        <p class="text-xs text-[#6B8EA0]">Books read</p>
      </div>
      <div class="text-center px-4 border-r border-[#E8EDF0]">
        <p class="text-2xl font-bold" style="<?= BALOO ?> color: #E76F51"><?= e($student['readingStreak']) ?></p>
        <p class="text-xs text-[#6B8EA0]">Day streak 🔥</p>
      </div>
      <?php foreach ($student['badges'] as $badge): ?>
        <div class="flex flex-col items-center gap-1 px-3" style="opacity: <?= $badge['earned'] ? '1' : '0.3' ?>" title="<?= e($badge['description']) ?>">
          <span class="text-2xl"><?= e($badge['emoji']) ?></span>
          <span class="text-[9px] font-medium text-[#264653] whitespace-nowrap"><?= e($badge['name']) ?></span>
        </div>
      <?php endforeach; ?>
    </div>
  </div>

  <!-- Tabs -->
  <div class="flex gap-1 p-1 rounded-xl mb-6 bg-white border border-[#E8EDF0]">
    <?php foreach ($tabs as $tab): $isActive = $tab['id'] === $activeTab; ?>
      <a href="<?= e(queryWith(['tab' => $tab['id']])) ?>"<?= $isActive ? ' aria-current="page"' : '' ?>
        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all"
        style="background-color: <?= $isActive ? '#2A9D8F' : 'transparent' ?>; color: <?= $isActive ? 'white' : '#6B8EA0' ?>">
        <?= e($tab['label']) ?>
        <span class="text-xs px-1.5 py-0.5 rounded-full font-bold" style="background-color: <?= $isActive ? 'rgba(255,255,255,0.25)' : '#F0F4F6' ?>; color: <?= $isActive ? 'white' : '#6B8EA0' ?>">
          <?= $tab['count'] ?>
        </span>
      </a>
    <?php endforeach; ?>
  </div>

  <?php if ($activeTab === 'borrowed'): ?>
    <!-- Borrowed tab -->
    <div class="space-y-3">
      <?php if (! $borrowed): ?>
        <div class="text-center py-16 bg-white rounded-2xl border border-[#E8EDF0]">
          <p class="text-5xl mb-3">📭</p>
          <p class="font-bold text-[#264653]" style="<?= BALOO ?>">No books borrowed</p>
          <p class="text-sm text-[#6B8EA0] mt-1">Find something great in the catalog!</p>
          <a href="<?= e(url('catalog')) ?>" class="inline-block mt-4 px-6 py-2.5 rounded-xl text-sm font-bold text-white" style="background-color: #2A9D8F">
            Browse Catalog
          </a>
        </div>
      <?php else: ?>
        <?php foreach ($borrowed as ['record' => $record, 'book' => $book]):
            $diff = daysUntil($record['dueDate']);
            if ($diff < 0) {
                $days = abs($diff);
                $due = ['bg' => '#FEF0EE', 'icon' => '⚠️', 'color' => '#E76F51', 'noteColor' => '#C55A3E',
                    'text' => 'Overdue by '.$days.' day'.($days !== 1 ? 's' : '').'!', 'note' => 'Please return ASAP'];
            } elseif ($diff <= 3) {
                $due = ['bg' => '#FFF8E0', 'icon' => '🕐', 'color' => '#C49A00', 'noteColor' => '#A07A00',
                    'text' => 'Due in '.$diff.' day'.($diff !== 1 ? 's' : ''), 'note' => $record['dueDate']];
            } else {
                $due = ['bg' => '#E8F8F0', 'icon' => '✅', 'color' => '#2D7A50', 'noteColor' => '#3A9A6E',
                    'text' => 'Due in '.$diff.' days', 'note' => $record['dueDate']];
            }
        ?>
          <div class="relative bg-white rounded-2xl border border-[#E8EDF0] p-4 flex gap-4 hover:shadow-md transition-all cursor-pointer">
            <?= bookCover($book, 'md') ?>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-[#264653] mb-0.5" style="<?= BALOO ?>">
                <a href="<?= e(url('books/'.$book['id'])) ?>" class="after:absolute after:inset-0"><?= e($book['title']) ?></a>
              </h3>
              <p class="text-sm text-[#6B8EA0] mb-3"><?= e($book['author']) ?></p>
              <div class="flex flex-wrap gap-2 items-center">
                <div class="flex items-center gap-1.5 px-3 py-1 rounded-lg" style="background-color: <?= $due['bg'] ?>">
                  <span class="text-sm"><?= $due['icon'] ?></span>
                  <div>
                    <p class="text-xs font-bold" style="color: <?= $due['color'] ?>"><?= e($due['text']) ?></p>
                    <p class="text-[10px]" style="color: <?= $due['noteColor'] ?>"><?= e($due['note']) ?></p>
                  </div>
                </div>
                <button type="button"<?= toastAttrs('Return processed! Thank you. ✅', 'success') ?>
                  class="relative z-10 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E8EDF0] text-[#264653] hover:bg-[#F0F4F6] transition-colors">
                  Mark Returned
                </button>
                <button type="button"<?= toastAttrs('Renewal requested! Extended by 7 days.', 'success') ?>
                  class="relative z-10 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-colors" style="background-color: #2A9D8F">
                  Renew
                </button>
              </div>
              <p class="text-xs text-[#9BB5C0] mt-2">
                Borrowed <?= e(fmtDate($record['borrowDate'], 'M j, Y')) ?>
              </p>
            </div>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>
  <?php endif; ?>

  <?php if ($activeTab === 'history'): ?>
    <!-- History tab -->
    <div class="space-y-3">
      <?php if (! $history): ?>
        <div class="text-center py-16 bg-white rounded-2xl border border-[#E8EDF0]">
          <p class="text-5xl mb-3">📖</p>
          <p class="font-bold text-[#264653]" style="<?= BALOO ?>">No reading history yet</p>
        </div>
      <?php else: ?>
        <?php foreach ($history as ['record' => $record, 'book' => $book]): ?>
          <div class="relative bg-white rounded-2xl border border-[#E8EDF0] p-4 flex gap-4 cursor-pointer hover:shadow-md transition-all">
            <?= bookCover($book, 'md') ?>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-[#264653] mb-0.5" style="<?= BALOO ?>">
                <a href="<?= e(url('books/'.$book['id'])) ?>" class="after:absolute after:inset-0"><?= e($book['title']) ?></a>
              </h3>
              <p class="text-sm text-[#6B8EA0] mb-2"><?= e($book['author']) ?></p>
              <?= levelBadge($book['readingLevel'], false, 'text-[10px] font-bold px-2 py-0.5') ?>
              <div class="flex gap-3 mt-2 text-xs text-[#9BB5C0]">
                <span>Borrowed: <?= e(fmtDate($record['borrowDate'], 'M j, Y')) ?></span>
                <?php if (! empty($record['returnDate'])): ?>
                  <span>Returned: <?= e(fmtDate($record['returnDate'], 'M j, Y')) ?></span>
                <?php endif; ?>
              </div>
              <div class="mt-2 flex items-center gap-0.5">
                <?php for ($star = 1; $star <= 5; $star++): ?>
                  <button type="button"<?= toastAttrs('Rated "'.$book['title'].'" '.$star.' stars! ⭐', 'success') ?> aria-label="Rate <?= $star ?> star<?= $star !== 1 ? 's' : '' ?>"
                    class="relative z-10 text-base transition-transform hover:scale-125" style="color: #F9C74F">★</button>
                <?php endfor; ?>
                <span class="ml-1 text-xs text-[#9BB5C0]">Rate this book</span>
              </div>
            </div>
            <div class="flex-shrink-0 self-center">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full" style="background-color: #E8F8F0; color: #2D7A50">
                ✓ Read
              </span>
            </div>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>
  <?php endif; ?>

  <?php if ($activeTab === 'wishlist'): ?>
    <!-- Wishlist tab -->
    <div>
      <?php if (! $wishlist): ?>
        <div class="text-center py-16 bg-white rounded-2xl border border-[#E8EDF0]">
          <p class="text-5xl mb-3">🔖</p>
          <p class="font-bold text-[#264653]" style="<?= BALOO ?>">Your wishlist is empty</p>
          <p class="text-sm text-[#6B8EA0] mt-1">Save books you want to read next!</p>
        </div>
      <?php else: ?>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <?php foreach ($wishlist as $book): $available = isAvailable($book); ?>
            <div class="relative bg-white rounded-2xl border border-[#E8EDF0] p-4 flex gap-3 cursor-pointer hover:shadow-md transition-all">
              <?= bookCover($book, 'sm') ?>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-[#264653] text-sm leading-tight mb-0.5" style="<?= BALOO ?>">
                  <a href="<?= e(url('books/'.$book['id'])) ?>" class="after:absolute after:inset-0"><?= e($book['title']) ?></a>
                </h3>
                <p class="text-xs text-[#6B8EA0] mb-2"><?= e($book['author']) ?></p>
                <div class="flex flex-wrap gap-1.5">
                  <?= levelBadge($book['readingLevel']) ?>
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style="background-color: <?= $available ? '#E8F5F3' : '#F5F7F8' ?>; color: <?= $available ? '#1E7268' : '#9BB5C0' ?>">
                    <?= $available ? 'Available' : 'On hold' ?>
                  </span>
                </div>
                <button type="button"<?= toastAttrs($available ? '"'.$book['title'].'" borrowed! Due in 21 days. 📚' : 'Added to hold list!', 'success') ?>
                  class="relative z-10 mt-2 text-xs font-bold px-3 py-1 rounded-lg text-white transition-all" style="background-color: <?= $available ? '#2A9D8F' : '#F4A261' ?>">
                  <?= $available ? '📚 Borrow' : '📋 Hold' ?>
                </button>
              </div>
              <button type="button"<?= toastAttrs('Removed from wishlist.', 'info') ?> title="Remove from wishlist" aria-label="Remove from wishlist"
                class="relative z-10 self-start text-[#F4A261] text-xl flex-shrink-0">
                🔖
              </button>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>
  <?php endif; ?>
</div>
