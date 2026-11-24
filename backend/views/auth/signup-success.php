<?php
/**
 * Sign-up success screen (ported from the "signup-success" screen of src/screens/Login.tsx).
 * @var string $role @var string $name
 */
$roles = roleOptions();
$current = $roles[$role] ?? $roles['student'];
$role = $current['id'];
$name = trim((string) ($name ?? ''));
$message = match ($role) {
    'student' => 'Your account is ready. Sign in with your Student ID to start exploring the library.',
    'teacher' => 'Your account is pending librarian approval. Contact the library to activate it.',
    default => 'Your account is pending approval from an existing librarian. Contact the library to activate it.',
};
$steps = $role === 'student'
    ? ['Account registered ✓', 'Sign in with your Student ID', 'Start borrowing books!']
    : ['Account request submitted ✓', 'Awaiting librarian approval', 'Sign in with your school email after approval'];
?>
<div class="min-h-screen flex flex-col items-center justify-center px-4 py-12" style="background-color: #FDFBF7">
  <!-- Background decoration -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-5" style="background-color: #2A9D8F"></div>
    <div class="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-5" style="background-color: #F4A261"></div>
  </div>

  <div class="w-full max-w-md relative">
    <!-- Logo -->
    <div class="text-center mb-10">
      <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg" style="background-color: #2A9D8F">📚</div>
      <h1 class="text-4xl font-bold mb-1" style="<?= BALOO ?>"><span style="color: #2A9D8F">Book</span><span style="color: #F4A261">Sphere</span></h1>
      <p class="text-sm" style="color: #6B8EA0">Westview Academy Library System</p>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-[#E8EDF0] p-8 text-center">
      <div class="relative w-20 h-20 mx-auto mb-5">
        <div class="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl" style="background-color: #E8F5F3">🎉</div>
        <div class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm bg-white border-2 border-white shadow"><?= e($current['emoji']) ?></div>
      </div>

      <h2 class="text-2xl font-bold mb-2" style="<?= BALOO ?> color: #264653">Account created!</h2>
      <p class="text-sm mb-1" style="color: #264653">Welcome to BookSphere, <strong><?= e($name !== '' ? $name : 'reader') ?></strong>!</p>
      <p class="text-xs mb-6" style="color: #6B8EA0"><?= e($message) ?></p>

      <div class="text-left space-y-2 mb-6 p-4 rounded-xl" style="background-color: #F5F9FA">
        <?php foreach ($steps as $index => $step): ?>
        <div class="flex items-center gap-2.5">
          <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style="background-color: <?= e($current['color']) ?>"><?= $index + 1 ?></div>
          <p class="text-xs" style="color: #264653"><?= e($step) ?></p>
        </div>
        <?php endforeach ?>
      </div>

      <a href="<?= e(url('login')) ?>" class="block w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style="background-color: <?= e($current['color']) ?>">Go to Sign In</a>
    </div>
  </div>
</div>
