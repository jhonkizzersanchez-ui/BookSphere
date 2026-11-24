<?php
/**
 * Librarian panel: Manage Books section. Included by librarian-panel.php.
 * Search: ?section=books&q=... (title or author). ?add=1 opens the Add Book modal on load.
 * The modal itself is views/librarian/book-modal.php.
 * @var array $allBooks
 */
$q = queryString('q');
$needle = mb_strtolower($q);
$filteredBooks = array_values(array_filter($allBooks, fn (array $book) => str_contains(mb_strtolower($book['title']), $needle)
    || str_contains(mb_strtolower($book['author']), $needle)));
$autoOpenAdd = queryString('add') === '1';

$addTexts = json_encode(['heading' => 'Add New Book', 'save' => 'Add to Catalog']);
$editTexts = json_encode(['heading' => 'Edit Book', 'save' => 'Save Changes']);
$editFields = fn (array $book): string => json_encode([
    'title' => $book['title'],
    'author' => $book['author'],
    'genre' => implode(', ', $book['genre']),
    'readingLevel' => $book['readingLevel'],
    'arPoints' => isset($book['arPoints']) ? (string) $book['arPoints'] : '',
    'lexile' => isset($book['lexile']) ? (string) $book['lexile'] : '',
    'copies' => (string) $book['totalCopies'],
    'yearPublished' => (string) $book['yearPublished'],
    'savedMessage' => 'updated! ✏️',
]);
?>
<div class="space-y-4">
  <div class="flex items-center justify-between flex-wrap gap-3">
    <h1 class="text-2xl font-bold" style="<?= BALOO ?> color: #264653">Manage Books</h1>
    <div class="flex gap-2">
      <button type="button"<?= toastAttrs('CSV template downloaded! Upload your file to bulk import.', 'info') ?>
        class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-[#E8EDF0] bg-white text-[#264653] hover:bg-[#F0F4F6]">
        📥 Bulk Import
      </button>
      <button type="button" data-modal-open="#book-modal" data-texts="<?= e($addTexts) ?>"<?= $autoOpenAdd ? ' data-modal-autoopen' : '' ?>
        class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
        style="background-color: #9B5DE5">
        + Add Book
      </button>
    </div>
  </div>

  <form action="<?= e(url('dashboard')) ?>" method="get" role="search">
    <input type="hidden" name="section" value="books">
    <input type="text" name="q" value="<?= e($q) ?>" placeholder="Search by title or author…" aria-label="Search by title or author"
      class="w-full px-4 py-2.5 rounded-xl border border-[#E8EDF0] bg-white text-sm text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#9B5DE5]/30">
  </form>

  <div class="bg-white rounded-2xl border border-[#E8EDF0] overflow-hidden">
    <table class="w-full">
      <thead>
        <tr class="border-b border-[#E8EDF0]">
          <?php foreach (['Book', 'Level', 'Copies', 'Available', 'Rating', 'Actions'] as $heading): ?>
            <th class="text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B8EA0]"><?= e($heading) ?></th>
          <?php endforeach; ?>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($filteredBooks as $book): $avail = $book['totalCopies'] - $book['borrowedCopies']; ?>
          <tr class="border-b border-[#F0F4F6] hover:bg-[#F8FAFB] transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <?= bookCover($book, 'xs') ?>
                <div>
                  <p class="text-sm font-semibold text-[#264653]"><?= e($book['title']) ?></p>
                  <p class="text-xs text-[#6B8EA0]"><?= e($book['author']) ?> · <?= e($book['yearPublished']) ?></p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <?= levelBadge($book['readingLevel'], true, 'text-[10px] font-bold px-2 py-0.5') ?>
            </td>
            <td class="px-4 py-3 text-sm text-[#264653]"><?= e($book['totalCopies']) ?></td>
            <td class="px-4 py-3">
              <span class="text-xs font-bold" style="color: <?= $avail > 0 ? '#2D7A50' : '#E76F51' ?>">
                <?= e($avail) ?>/<?= e($book['totalCopies']) ?>
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1">
                <span class="text-xs" style="color: #F9C74F">★</span>
                <span class="text-xs font-semibold text-[#264653]"><?= e(number_format($book['rating'], 1)) ?></span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-1">
                <button type="button" data-modal-open="#book-modal" data-fields="<?= e($editFields($book)) ?>" data-texts="<?= e($editTexts) ?>"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[#E8EDF0] text-[#264653] hover:bg-[#F0F4F6]">
                  Edit
                </button>
                <button type="button"<?= toastAttrs('"'.$book['title'].'" removed from catalog.', 'info') ?>
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#E76F51] hover:bg-[#FEF0EE]">
                  Remove
                </button>
              </div>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
