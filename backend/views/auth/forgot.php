<?php
/**
 * Forgot-password screen (ported from the "forgot" screen of src/screens/Login.tsx).
 * The role tabs are radio inputs inside the form (selected styling is CSS has-checked), so switching
 * tabs keeps the typed email and needs no JS. The role is posted back only to keep the tab on re-render.
 * @var string $role @var string $email @var string $error
 */
$roles = roleOptions();
$current = $roles[$role] ?? $roles['student'];
$role = $current['id'];
$inputCls = static fn (bool $hasError): string => 'w-full px-3 py-2.5 rounded-xl border text-sm text-[#264653] placeholder:text-[#BCCDD5] focus:outline-none focus:ring-2 transition-all '
    .($hasError ? 'border-[#E76F51] focus:ring-[#E76F51]/20' : 'border-[#E8EDF0] focus:ring-[#2A9D8F]/30 focus:border-[#2A9D8F]');
$hasError = $error !== '';
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

    <div class="bg-white rounded-2xl shadow-sm border border-[#E8EDF0] p-6">
      <a href="<?= e(url('login')) ?>" class="flex w-fit items-center gap-1.5 text-sm font-medium mb-5 hover:opacity-70 transition-opacity" style="color: #6B8EA0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to sign in
      </a>

      <div class="flex items-center gap-3 mb-5">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style="background-color: #FFF3E8">🔑</div>
        <div>
          <h2 class="text-lg font-bold" style="<?= BALOO ?> color: #264653">Forgot your password?</h2>
          <p class="text-xs" style="color: #6B8EA0">No worries — we will help you reset it.</p>
        </div>
      </div>

      <form method="post" action="<?= e(url('forgot-password')) ?>">
        <?= csrfField() ?>

        <!-- Role toggle -->
        <div class="flex gap-1 p-1 bg-[#F5F7F8] rounded-xl mb-4" role="radiogroup" aria-label="I am a…">
          <?php foreach ($roles as $option): ?>
          <label class="relative flex-1 py-1.5 rounded-lg text-xs font-semibold text-center transition-all text-[#6B8EA0] has-checked:bg-white has-checked:text-[<?= e($option['color']) ?>] has-checked:shadow-[0_1px_3px_rgba(0,0,0,0.08)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#264653]">
            <input type="radio" name="role" value="<?= e($option['id']) ?>" class="sr-only"<?= $role === $option['id'] ? ' checked' : '' ?>>
            <?= e($option['emoji']) ?> <?= e($option['label']) ?>
          </label>
          <?php endforeach ?>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block" style="color: #264653">
              <span class="block text-xs font-semibold mb-1.5">Registered school email</span>
              <input
                type="email"
                name="email"
                value="<?= e($email) ?>"
                required
                autocomplete="email"
                placeholder="Enter your registered email"
                class="<?= $inputCls($hasError) ?>"
                <?= $hasError ? 'aria-invalid="true" aria-describedby="forgot-email-error" data-ok-class="'.$inputCls(false).'"' : '' ?>
              >
            </label>
            <?php if ($hasError): ?>
            <p id="forgot-email-error" data-error-for="email role" class="text-[11px] mt-1 font-medium" style="color: #E76F51"><?= e($error) ?></p>
            <?php endif ?>
          </div>
          <p class="text-xs text-[#6B8EA0]">Use the email address you registered with. If you cannot access it, contact your librarian.</p>
          <button type="submit" data-busy-text="Sending…" class="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#2A9D8F] disabled:opacity-60">Send reset link</button>
        </div>
      </form>
    </div>
  </div>
</div>
<script src="<?= e(asset('auth.js')) ?>" defer></script>
