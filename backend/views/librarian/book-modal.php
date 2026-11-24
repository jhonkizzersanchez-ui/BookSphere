<?php
/**
 * Librarian panel: Add/Edit Book modal. Included by librarian-panel.php on the books section.
 * Opened by buttons with data-modal-open="#book-modal" (see assets/app.js):
 *   "+ Add Book" passes only data-texts, so every field falls back to its data-default (the empty form).
 *   "Edit" passes data-fields with the book's values and data-texts for the heading and save label.
 * Saving is a mock (as in the React app): the save button shows a toast and closes the modal.
 * The hidden "savedMessage" field picks the toast wording: "added to catalog! 📚" by default, "updated! ✏️" when editing.
 */
$fieldClass = 'w-full px-3 py-2.5 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#9B5DE5]/30';
$textFields = [
    ['field' => 'title', 'label' => 'Title', 'placeholder' => 'Book title'],
    ['field' => 'author', 'label' => 'Author', 'placeholder' => 'Author name'],
    ['field' => 'genre', 'label' => 'Genres', 'placeholder' => 'e.g. Fantasy, Adventure'],
    ['field' => 'yearPublished', 'label' => 'Year Published', 'placeholder' => 'e.g. 2012'],
];
$numberFields = [
    ['field' => 'copies', 'label' => 'Copies', 'default' => '3'],
    ['field' => 'arPoints', 'label' => 'AR Points', 'default' => ''],
    ['field' => 'lexile', 'label' => 'Lexile', 'default' => ''],
];
$defaultLevel = 'Grades 6-8';
$addedMessage = 'added to catalog! 📚';
?>
<div id="book-modal" data-modal hidden role="dialog" aria-modal="true" aria-labelledby="book-modal-heading"
  class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background-color: rgba(38, 70, 83, 0.4)">
  <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
    <div class="flex items-center justify-between mb-5">
      <h2 id="book-modal-heading" data-modal-text="heading" class="text-xl font-bold" style="<?= BALOO ?> color: #264653">Add New Book</h2>
      <button type="button" data-modal-close aria-label="Close" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0F4F6] text-[#6B8EA0]">✕</button>
    </div>

    <div class="space-y-3">
      <?php foreach ($textFields as $input): ?>
        <div>
          <label for="book-<?= e($input['field']) ?>" class="block text-xs font-semibold text-[#264653] mb-1"><?= e($input['label']) ?></label>
          <input type="text" id="book-<?= e($input['field']) ?>" name="<?= e($input['field']) ?>" value="" data-default=""
            placeholder="<?= e($input['placeholder']) ?>" class="<?= $fieldClass ?>">
        </div>
      <?php endforeach; ?>

      <div>
        <label for="book-readingLevel" class="block text-xs font-semibold text-[#264653] mb-1">Reading Level</label>
        <select id="book-readingLevel" name="readingLevel" data-default="<?= e($defaultLevel) ?>" class="<?= $fieldClass ?>">
          <?php foreach (READING_LEVELS as $level): ?>
            <option<?= $level === $defaultLevel ? ' selected' : '' ?>><?= e($level) ?></option>
          <?php endforeach; ?>
        </select>
      </div>

      <div class="grid grid-cols-3 gap-3">
        <?php foreach ($numberFields as $input): ?>
          <div>
            <label for="book-<?= e($input['field']) ?>" class="block text-xs font-semibold text-[#264653] mb-1"><?= e($input['label']) ?></label>
            <input type="number" id="book-<?= e($input['field']) ?>" name="<?= e($input['field']) ?>" value="<?= e($input['default']) ?>" data-default="<?= e($input['default']) ?>"
              class="w-full px-3 py-2.5 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] focus:outline-none">
          </div>
        <?php endforeach; ?>
      </div>

      <div>
        <label class="block text-xs font-semibold text-[#264653] mb-1">Cover Image</label>
        <div class="border-2 border-dashed border-[#E8EDF0] rounded-xl p-6 text-center hover:border-[#9B5DE5] transition-colors cursor-pointer">
          <p class="text-3xl mb-1">🖼️</p>
          <p class="text-xs text-[#6B8EA0]">Click to upload cover image</p>
        </div>
      </div>
    </div>

    <input type="hidden" name="savedMessage" value="<?= e($addedMessage) ?>" data-default="<?= e($addedMessage) ?>">

    <div class="flex gap-3 mt-5">
      <button type="button" data-modal-close class="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-[#E8EDF0] text-[#264653] hover:bg-[#F0F4F6]">
        Cancel
      </button>
      <button type="button"<?= toastAttrs('"{title}" {savedMessage}', 'success') ?> data-modal-close data-modal-text="save"
        class="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style="background-color: #9B5DE5">Add to Catalog</button>
    </div>
  </div>
</div>
