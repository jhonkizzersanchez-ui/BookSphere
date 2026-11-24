<?php
/**
 * Book details (ported from BookDetails.tsx). Route: /books/{id}
 * @var array $user @var array|null $book (null when the id is unknown)
 */
$role = $user['role'];
if (empty($book)): ?>
<div class="flex items-center justify-center h-64 text-[#6B8EA0]">
  <div class="text-center">
    <p class="text-5xl mb-3">📭</p>
    <p class="font-semibold">Book not found</p>
    <a href="<?= e(url('catalog')) ?>" class="inline-block mt-3 text-sm font-semibold" style="color: #2A9D8F">Back to Catalog</a>
  </div>
</div>
<?php return; endif;

$lvl = levelColors($book['readingLevel']);
$available = isAvailable($book);
$copiesLeft = $book['totalCopies'] - $book['borrowedCopies'];
$student = currentStudent();
$isBorrowed = in_array($book['id'], array_column($student['borrowedBooks'], 'bookId'), true);
$isWishlisted = in_array($book['id'], $student['wishlist'], true);
$similar = array_slice(array_values(array_filter(
    books(),
    fn (array $other) => $other['id'] !== $book['id'] && array_intersect($other['genre'], $book['genre'])
)), 0, 4);
$stats = [
    ['label' => 'AR Points', 'value' => ! empty($book['arPoints']) ? $book['arPoints'].' pts' : '—', 'color' => '#F4A261'],
    ['label' => 'Lexile Score', 'value' => ! empty($book['lexile']) ? $book['lexile'].'L' : '—', 'color' => '#4361EE'],
    ['label' => 'Published', 'value' => (string) $book['yearPublished'], 'color' => '#9B5DE5'],
];
$secondaryButton = 'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 border-[#E8EDF0] text-[#264653] hover:bg-[#F0F4F6]';
?>
<div class="max-w-5xl mx-auto px-4 py-6">
  <!-- Back button -->
  <a href="<?= e(url('catalog')) ?>" class="flex w-fit items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-70 transition-opacity" style="color: #6B8EA0">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Back to Catalog
  </a>

  <!-- Main info -->
  <div class="bg-white rounded-2xl border border-[#E8EDF0] p-6 mb-6">
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Cover -->
      <div class="flex-shrink-0 flex justify-center md:justify-start">
        <?= bookCover($book, 'xl') ?>
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap gap-2 mb-3">
          <span class="text-xs font-bold px-2.5 py-1 rounded-full"
            style="background-color: <?= e($lvl['bg']) ?>; color: <?= e($lvl['text']) ?>; border: 1px solid <?= e($lvl['border']) ?>"><?= e($book['readingLevel']) ?></span>
          <?php if (! empty($book['series'])): ?>
            <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-[#FFF8E0] text-[#C49A00]">Series: <?= e($book['series']) ?></span>
          <?php endif; ?>
          <span class="text-xs font-bold px-2.5 py-1 rounded-full"
            style="background-color: <?= $available ? '#E8F5F3' : '#FEF0EE' ?>; color: <?= $available ? '#1E7268' : '#C55A3E' ?>"><?= e($available ? '✓ Available ('.$copiesLeft.'/'.$book['totalCopies'].')' : 'Out of copies (0/'.$book['totalCopies'].')') ?></span>
        </div>

        <h1 class="text-3xl font-bold text-[#264653] mb-1" style="<?= BALOO ?>">
          <?= e($book['title']) ?>
        </h1>
        <p class="text-lg text-[#6B8EA0] mb-3">by <?= e($book['author']) ?> · <?= e($book['yearPublished']) ?></p>

        <div class="flex items-center gap-3 mb-4">
          <?= stars($book['rating'], 'text-xl') ?>
          <span class="text-2xl font-bold" style="color: #264653; <?= BALOO ?>"><?= number_format($book['rating'], 1) ?></span>
          <span class="text-sm text-[#6B8EA0]">(<?= e($book['reviewCount']) ?> reviews)</span>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <?php foreach ($stats as $stat): ?>
            <div class="px-3 py-2 rounded-xl" style="background-color: <?= e($stat['color']) ?>12">
              <p class="text-[10px] font-medium" style="color: #6B8EA0"><?= e($stat['label']) ?></p>
              <p class="text-base font-bold" style="color: <?= e($stat['color']) ?>; <?= BALOO ?>"><?= e($stat['value']) ?></p>
            </div>
          <?php endforeach; ?>
        </div>

        <!-- Genre tags -->
        <div class="flex flex-wrap gap-1.5 mb-5">
          <?php foreach ($book['genre'] as $genre) echo genreTag($genre, 'text-xs font-semibold px-3 py-1'); ?>
        </div>

        <!-- Synopsis -->
        <p class="text-sm leading-relaxed text-[#264653] mb-5"><?= e($book['synopsis']) ?></p>

        <!-- Action buttons -->
        <?php if ($role === 'student'): ?>
          <div class="flex flex-wrap gap-3">
            <button type="button"<?= $available ? toastAttrs('Book borrowed! Due in 21 days. 📚', 'success') : toastAttrs("Added to your hold list! You'll be notified when it's available.", 'info') ?>
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style="background-color: <?= $isBorrowed ? '#6B8EA0' : ($available ? '#2A9D8F' : '#F4A261') ?>">
              <?= $isBorrowed ? '✓ Currently Reading' : ($available ? '📚 Borrow Book' : '📋 Join Hold List') ?>
            </button>
            <button type="button"<?= $isWishlisted ? toastAttrs('Removed from wishlist.', 'info') : toastAttrs('Added to wishlist! 🔖', 'success') ?>
              class="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all hover:opacity-80"
              style="border-color: <?= $isWishlisted ? '#F4A261' : '#E8EDF0' ?>; color: <?= $isWishlisted ? '#F4A261' : '#264653' ?>; background-color: <?= $isWishlisted ? '#FFF3E8' : 'white' ?>">
              <?= $isWishlisted ? '🔖 Wishlisted' : '🔖 Add to Wishlist' ?>
            </button>
          </div>
        <?php elseif ($role === 'teacher'): ?>
          <div class="flex flex-wrap gap-3">
            <button type="button"<?= toastAttrs('Book added to your class reading list!', 'success') ?>
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white" style="background-color: #4361EE">
              📋 Add to Class Reading List
            </button>
            <button type="button"<?= toastAttrs('Classroom copies requested!', 'success') ?> class="<?= $secondaryButton ?>">
              📦 Request Classroom Copies
            </button>
          </div>
        <?php elseif ($role === 'librarian'): ?>
          <div class="flex flex-wrap gap-3">
            <button type="button"<?= toastAttrs('Opening edit form…', 'info') ?>
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white" style="background-color: #9B5DE5">
              ✏️ Edit Book Record
            </button>
            <button type="button"<?= toastAttrs('Processing reservation…', 'info') ?> class="<?= $secondaryButton ?>">
              📋 Reserve for Student
            </button>
          </div>
        <?php endif; ?>
      </div>
    </div>
  </div>

  <!-- Reviews -->
  <div class="bg-white rounded-2xl border border-[#E8EDF0] p-6 mb-6">
    <h2 class="text-xl font-bold mb-4" style="<?= BALOO ?> color: #264653">
      Student Book Talks 💬
    </h2>
    <?php if (! empty($book['reviews'])): ?>
      <div class="space-y-4">
        <?php foreach ($book['reviews'] as $review): ?>
          <div class="flex gap-3">
            <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style="background-color: #2A9D8F">
              <?= e(mb_substr($review['studentName'], 0, 1)) ?>
            </div>
            <div class="flex-1 bg-[#F5F9FA] rounded-xl p-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-semibold text-[#264653]"><?= e($review['studentName']) ?></span>
                <span class="text-xs text-[#9BB5C0]">Grade <?= e($review['grade']) ?> · <?= e(fmtDate($review['date'])) ?></span>
              </div>
              <div class="flex gap-0.5 mb-1.5">
                <?php for ($star = 1; $star <= 5; $star++): ?>
                  <span class="text-xs" style="color: <?= $star <= $review['rating'] ? '#F9C74F' : '#D8E8EC' ?>">★</span>
                <?php endfor; ?>
              </div>
              <p class="text-sm text-[#264653] leading-relaxed"><?= e($review['text']) ?></p>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    <?php else: ?>
      <div class="text-center py-8">
        <p class="text-3xl mb-2">💬</p>
        <p class="text-sm text-[#6B8EA0]">No reviews yet. Be the first to share your thoughts!</p>
      </div>
    <?php endif; ?>
    <?php if ($role === 'student'): ?>
      <button type="button"<?= toastAttrs('Review submitted! Thanks for sharing. ⭐', 'success') ?>
        class="mt-4 w-full py-2.5 rounded-xl border-2 border-dashed border-[#D8E8EC] text-sm font-medium text-[#6B8EA0] hover:border-[#2A9D8F] hover:text-[#2A9D8F] transition-all">
        + Write a Book Talk review
      </button>
    <?php endif; ?>
  </div>

  <!-- Similar books -->
  <div>
    <h2 class="text-xl font-bold mb-4" style="<?= BALOO ?> color: #264653">
      More Books Like This ✨
    </h2>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <?php foreach ($similar as $other): ?>
        <a href="<?= e(url('books/'.$other['id'])) ?>" class="block bg-white rounded-2xl p-3 border border-[#E8EDF0] cursor-pointer hover:shadow-md transition-all hover:border-[#2A9D8F]/30">
          <?= bookCover($other, 'md', 'w-full mb-2') ?>
          <p class="text-sm font-bold text-[#264653] leading-tight line-clamp-2" style="<?= BALOO ?>"><?= e($other['title']) ?></p>
          <p class="text-xs text-[#6B8EA0] mt-0.5"><?= e($other['author']) ?></p>
          <div class="flex items-center justify-between mt-1.5">
            <div class="flex gap-0.5">
              <span class="text-xs" style="color: #F9C74F">★</span>
              <span class="text-xs font-semibold text-[#264653]"><?= number_format($other['rating'], 1) ?></span>
            </div>
            <?= levelBadge($other['readingLevel']) ?>
          </div>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
</div>
