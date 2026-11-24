<?php /** @var string $heading @var string $message */ ?>
<div class="min-h-screen flex items-center justify-center bg-[#FDFBF7] px-6">
  <div class="max-w-md text-center text-[#264653]">
    <p class="text-5xl mb-3">📭</p>
    <h1 class="text-xl font-bold mb-2" style="<?= BALOO ?>"><?= e($heading) ?></h1>
    <p class="text-sm text-[#6B8EA0]"><?= e($message) ?></p>
    <a href="<?= e(url('/')) ?>" class="inline-block mt-4 px-5 py-2 rounded-xl bg-[#2A9D8F] text-white text-sm font-semibold">Go to BookSphere</a>
  </div>
</div>
