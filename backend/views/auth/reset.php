<?php
/**
 * "Choose a new password" screen (ported from the "reset" screen of src/screens/Login.tsx).
 * @var string $email @var string $token @var string $error
 */
$inputCls = 'w-full px-3 py-2.5 rounded-xl border text-sm text-[#264653] placeholder:text-[#BCCDD5] focus:outline-none focus:ring-2 transition-all border-[#E8EDF0] focus:ring-[#2A9D8F]/30 focus:border-[#2A9D8F]';
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

    <div class="bg-white rounded-2xl border border-[#E8EDF0] p-6">
      <h2 class="text-xl font-bold text-[#264653] mb-4">Choose a new password</h2>
      <form method="post" action="<?= e(url('reset-password')) ?>" class="space-y-4">
        <?= csrfField() ?>
        <input type="hidden" name="email" value="<?= e($email) ?>">
        <input type="hidden" name="token" value="<?= e($token) ?>">
        <div>
          <label class="block" style="color: #264653">
            <span class="block text-xs font-semibold mb-1.5">New password</span>
            <input type="password" name="password" autocomplete="new-password" minlength="12" required class="<?= $inputCls ?>" placeholder="12+ characters with letters and numbers">
          </label>
        </div>
        <div>
          <label class="block" style="color: #264653">
            <span class="block text-xs font-semibold mb-1.5">Confirm password</span>
            <input type="password" name="password_confirmation" autocomplete="new-password" required class="<?= $inputCls ?>">
          </label>
        </div>
        <?php if ($error !== ''): ?>
        <p role="alert" class="text-xs text-[#E76F51]"><?= e($error) ?></p>
        <?php endif ?>
        <button type="submit" data-busy-text="Updating…" class="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#2A9D8F] disabled:opacity-60">Update password</button>
      </form>
      <a href="<?= e(url('forgot-password')) ?>" class="inline-block mt-4 text-xs font-semibold text-[#2A9D8F]">Request a new reset link</a>
    </div>
  </div>
</div>
