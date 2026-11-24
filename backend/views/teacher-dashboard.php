<?php
/**
 * Teacher dashboard (ported from TeacherDashboard.tsx).
 * Tabs: ?tab=class|lists|requests. Student search: ?tab=class&student=...
 * @var array $user
 */
$tabs = ['class' => '👥 Class Reading', 'lists' => '📋 Reading Lists', 'requests' => '📦 Requests'];
$activeTab = queryString('tab', 'class');
if (! isset($tabs[$activeTab])) {
    $activeTab = 'class';
}
$searchStudent = queryString('student');

$readingListBooks = [
    ['bookId' => 'b1', 'required' => true],
    ['bookId' => 'b5', 'required' => false],
    ['bookId' => 'b7', 'required' => false],
];

$students = classStudents();
$overdueStudents = array_values(array_filter($students, fn ($s) => $s['overdueCount'] > 0));
$overdueCount = count($overdueStudents);
$totalOverdue = array_sum(array_column($students, 'overdueCount'));
$avgBooks = $students ? (int) round(array_sum(array_column($students, 'booksReadThisYear')) / count($students)) : 0;
$activeReaders = count(array_filter($students, fn ($s) => ! empty($s['currentBookId'])));

$needle = mb_strtolower($searchStudent);
$filtered = array_values(array_filter($students, fn ($s) => str_contains(mb_strtolower($s['name']), $needle)));

$stats = [
    ['label' => 'Students', 'value' => count($students), 'sub' => 'in your class', 'emoji' => '👥', 'color' => '#4361EE'],
    ['label' => 'Active Readers', 'value' => $activeReaders, 'sub' => 'currently borrowing', 'emoji' => '📖', 'color' => '#2A9D8F'],
    ['label' => 'Overdue Books', 'value' => $totalOverdue, 'sub' => $overdueCount.' student'.($overdueCount !== 1 ? 's' : '').' affected', 'emoji' => '⚠️', 'color' => $totalOverdue > 0 ? '#E76F51' : '#52B788'],
    ['label' => 'Avg Books Read', 'value' => $avgBooks, 'sub' => 'this school year', 'emoji' => '📚', 'color' => '#F4A261'],
];

$recentRequests = [
    ['book' => 'The Giver', 'copies' => 12, 'status' => 'approved', 'date' => '2024-03-10'],
    ['book' => 'Holes', 'copies' => 10, 'status' => 'pending', 'date' => '2024-03-18'],
];

$inputClass = 'w-full px-3 py-2 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#4361EE]/30';
?>
<div class="max-w-6xl mx-auto px-4 py-6 space-y-6">
  <!-- Header -->
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold" style="<?= BALOO ?> color: #264653">
        Class 7B — Reading Overview
      </h1>
      <p class="text-sm" style="color: #6B8EA0"><?= e($user['name']) ?> · Reading overview</p>
    </div>
    <div class="flex gap-2">
      <button type="button"<?= toastAttrs('Report exported!', 'success') ?>
        class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-[#E8EDF0] bg-white text-[#264653] hover:bg-[#F0F4F6] transition-colors">
        📊 Export Report
      </button>
      <button type="button"<?= toastAttrs('Reminder sent to all students with overdue books!', 'success') ?>
        class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors hover:opacity-90"
        style="background-color: #4361EE">
        📬 Send Reminders
      </button>
    </div>
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <?php foreach ($stats as $stat): ?>
      <div class="bg-white rounded-2xl p-4 border border-[#E8EDF0]">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium" style="color: #6B8EA0"><?= e($stat['label']) ?></span>
          <span class="text-lg"><?= e($stat['emoji']) ?></span>
        </div>
        <p class="text-3xl font-bold" style="color: <?= e($stat['color']) ?>; <?= BALOO ?>"><?= e($stat['value']) ?></p>
        <p class="text-xs mt-0.5" style="color: #9BB5C0"><?= e($stat['sub']) ?></p>
      </div>
    <?php endforeach; ?>
  </div>

  <!-- Overdue alert -->
  <?php if ($overdueCount > 0): ?>
    <div class="bg-[#FEF0EE] border border-[#F0B0A0] rounded-2xl p-4 flex items-start gap-3">
      <span class="text-xl flex-shrink-0 mt-0.5">⚠️</span>
      <div class="flex-1">
        <p class="font-semibold text-sm" style="color: #C55A3E">
          <?= e($overdueCount) ?> student<?= $overdueCount !== 1 ? 's have' : ' has' ?> overdue books
        </p>
        <p class="text-xs mt-0.5" style="color: #A04030">
          <?= e(implode(', ', array_column($overdueStudents, 'name'))) ?>
        </p>
      </div>
      <button type="button"<?= toastAttrs('Reminders sent to students with overdue books!', 'success') ?>
        class="text-xs font-bold px-3 py-1.5 rounded-lg text-white flex-shrink-0"
        style="background-color: #E76F51">
        Send Reminders
      </button>
    </div>
  <?php endif; ?>

  <!-- Tabs -->
  <div class="flex gap-1 p-1 bg-white rounded-xl border border-[#E8EDF0]">
    <?php foreach ($tabs as $tab => $label): $isActive = $activeTab === $tab; ?>
      <a href="<?= e(queryWith(['tab' => $tab])) ?>"
        class="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center transition-all"
        style="background-color: <?= $isActive ? '#4361EE' : 'transparent' ?>; color: <?= $isActive ? 'white' : '#6B8EA0' ?>"<?= $isActive ? ' aria-current="page"' : '' ?>>
        <?= e($label) ?>
      </a>
    <?php endforeach; ?>
  </div>

  <?php if ($activeTab === 'class'): ?>
    <!-- Class Reading tab -->
    <div class="bg-white rounded-2xl border border-[#E8EDF0] overflow-hidden">
      <div class="p-4 border-b border-[#E8EDF0] flex items-center justify-between gap-3 flex-wrap">
        <h3 class="font-bold" style="<?= BALOO ?> color: #264653">
          Student Reading Status
        </h3>
        <form action="<?= e(url('dashboard')) ?>" method="get" role="search">
          <input type="hidden" name="tab" value="class">
          <input name="student" value="<?= e($searchStudent) ?>" aria-label="Search students"
            placeholder="Search students…"
            class="px-3 py-1.5 rounded-lg border border-[#E8EDF0] text-sm text-[#264653] focus:outline-none focus:ring-2 focus:ring-[#4361EE]/30">
        </form>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-[#E8EDF0]">
              <?php foreach (['Student', 'Reading Level', 'Current Book', 'Books Read', 'Status'] as $heading): ?>
                <th class="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style="color: #6B8EA0"><?= e($heading) ?></th>
              <?php endforeach; ?>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($filtered as $i => $student):
                $currentBook = $student['currentBookId'] ? findBook($student['currentBookId']) : null;
                $progress = min(100, ($student['booksReadThisYear'] / 20) * 100); ?>
              <tr class="border-b border-[#F0F4F6] hover:bg-[#F8FAFB] transition-colors<?= $i % 2 === 0 ? '' : ' bg-[#FAFCFD]' ?>">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style="background-color: #4361EE">
                      <?= e(mb_substr($student['name'], 0, 1)) ?>
                    </div>
                    <span class="text-sm font-semibold text-[#264653]"><?= e($student['name']) ?></span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <?= levelBadge($student['readingLevel'], true, 'text-xs font-semibold px-2 py-0.5') ?>
                </td>
                <td class="px-4 py-3">
                  <?php if ($currentBook): ?>
                    <a href="<?= e(url('books/'.$currentBook['id'])) ?>" class="flex items-center gap-2 cursor-pointer hover:opacity-70">
                      <?= bookCover($currentBook, 'xs') ?>
                      <div>
                        <p class="text-xs font-semibold text-[#264653] leading-tight"><?= e($currentBook['title']) ?></p>
                        <p class="text-[10px] text-[#6B8EA0]"><?= e($currentBook['author']) ?></p>
                      </div>
                    </a>
                  <?php else: ?>
                    <span class="text-xs text-[#9BB5C0]">Not borrowing</span>
                  <?php endif; ?>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-16 h-1.5 bg-[#E8EDF0] rounded-full overflow-hidden">
                      <div class="h-full rounded-full" style="width: <?= e($progress) ?>%; background-color: #4361EE"></div>
                    </div>
                    <span class="text-xs font-semibold text-[#264653]"><?= e($student['booksReadThisYear']) ?></span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <?php if ($student['overdueCount'] > 0): ?>
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full" style="background-color: #FEF0EE; color: #E76F51">
                      <?= e($student['overdueCount']) ?> overdue
                    </span>
                  <?php else: ?>
                    <span class="text-xs font-bold px-2 py-0.5 rounded-full" style="background-color: #E8F8F0; color: #2D7A50">
                      ✓ On track
                    </span>
                  <?php endif; ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  <?php endif; ?>

  <?php if ($activeTab === 'lists'): ?>
    <!-- Reading Lists tab -->
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-[#E8EDF0] p-4">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-bold" style="<?= BALOO ?> color: #264653">Spring Reading List — 7B</h3>
            <p class="text-xs text-[#6B8EA0]">3 books · 7 of 10 students on track</p>
          </div>
          <button type="button" data-toggle="#add-book-panel" aria-controls="add-book-panel"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style="background-color: #4361EE">
            + Add Book
          </button>
        </div>

        <div id="add-book-panel" hidden class="mb-4 p-3 rounded-xl border border-[#E8EDF0] bg-[#F8FAFB]">
          <p class="text-xs font-semibold text-[#264653] mb-2">Add book to reading list</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            <?php foreach (books() as $book): ?>
              <button type="button"<?= toastAttrs('"'.$book['title'].'" added to reading list!', 'success') ?> data-hide="#add-book-panel"
                class="flex items-center gap-2 p-2 rounded-lg text-left hover:bg-white border border-transparent hover:border-[#E8EDF0] transition-all">
                <?= bookCover($book, 'xs') ?>
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-[#264653] truncate"><?= e($book['title']) ?></p>
                  <p class="text-[10px] text-[#6B8EA0]"><?= e($book['author']) ?></p>
                </div>
              </button>
            <?php endforeach; ?>
          </div>
        </div>

        <div class="space-y-2">
          <?php foreach ($readingListBooks as $item):
              $book = findBook($item['bookId']);
              if (! $book) {
                  continue;
              } ?>
            <div class="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFB] border border-[#E8EDF0]">
              <?= bookCover($book, 'sm') ?>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-sm font-bold text-[#264653]" style="<?= BALOO ?>"><?= e($book['title']) ?></span>
                  <?php if ($item['required']): ?>
                    <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#FEF0EE] text-[#E76F51]">Required</span>
                  <?php endif; ?>
                </div>
                <p class="text-xs text-[#6B8EA0]"><?= e($book['author']) ?></p>
                <div class="flex gap-2 mt-1">
                  <?= levelBadge($book['readingLevel'], false) ?>
                  <span class="text-[9px] font-medium text-[#6B8EA0]">7 of 10 students borrowed</span>
                </div>
              </div>
              <a href="<?= e(url('books/'.$book['id'])) ?>"
                class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-[#E8EDF0] text-[#264653] hover:bg-white transition-colors flex-shrink-0">
                View
              </a>
            </div>
          <?php endforeach; ?>
        </div>
      </div>

      <button type="button"<?= toastAttrs('New reading list created!', 'success') ?>
        class="w-full py-3 rounded-2xl border-2 border-dashed border-[#D8E8EC] text-sm font-semibold text-[#6B8EA0] hover:border-[#4361EE] hover:text-[#4361EE] transition-all">
        + Create New Reading List
      </button>
    </div>
  <?php endif; ?>

  <?php if ($activeTab === 'requests'): ?>
    <!-- Requests tab -->
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-[#E8EDF0] p-5">
        <h3 class="font-bold mb-4" style="<?= BALOO ?> color: #264653">Request Classroom Copies</h3>
        <p class="text-sm text-[#6B8EA0] mb-4">Need multiple copies of a book for a class project or group read? Submit a request to the library.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label for="request-title" class="block text-xs font-semibold text-[#264653] mb-1">Book Title</label>
            <input id="request-title" placeholder="Search or enter title…" class="<?= $inputClass ?>">
          </div>
          <div>
            <label for="request-copies" class="block text-xs font-semibold text-[#264653] mb-1">Number of Copies</label>
            <input id="request-copies" type="number" min="1" max="35" value="10" class="<?= $inputClass ?>">
          </div>
          <div class="sm:col-span-2">
            <label for="request-date" class="block text-xs font-semibold text-[#264653] mb-1">Needed by Date</label>
            <input id="request-date" type="date" value="2024-04-01" class="<?= $inputClass ?>">
          </div>
          <div class="sm:col-span-2">
            <label for="request-notes" class="block text-xs font-semibold text-[#264653] mb-1">Notes for Librarian</label>
            <textarea id="request-notes" rows="2" placeholder="Any additional context for this request…" class="<?= $inputClass ?> resize-none"></textarea>
          </div>
        </div>
        <button type="button"<?= toastAttrs('Request submitted! The librarian will review it. 📦', 'success') ?>
          class="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
          style="background-color: #4361EE">
          Submit Request
        </button>
      </div>

      <!-- Past requests -->
      <div class="bg-white rounded-2xl border border-[#E8EDF0] p-5">
        <h3 class="font-bold mb-3" style="<?= BALOO ?> color: #264653">Recent Requests</h3>
        <?php foreach ($recentRequests as $req): $approved = $req['status'] === 'approved'; ?>
          <div class="flex items-center justify-between py-3 border-b border-[#F0F4F6] last:border-0">
            <div>
              <p class="text-sm font-semibold text-[#264653]"><?= e($req['book']) ?></p>
              <p class="text-xs text-[#6B8EA0]"><?= e($req['copies']) ?> copies · <?= e(fmtDate($req['date'], 'M j')) ?></p>
            </div>
            <span class="text-xs font-bold px-2.5 py-1 rounded-full"
              style="background-color: <?= $approved ? '#E8F5F3' : '#FFF3E8' ?>; color: <?= $approved ? '#1E7268' : '#B56120' ?>">
              <?= $approved ? '✓ Approved' : '⏳ Pending' ?>
            </span>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  <?php endif; ?>
</div>
