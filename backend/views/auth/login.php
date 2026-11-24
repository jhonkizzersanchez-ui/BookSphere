<?php
/**
 * Sign-in screen (ported from the "login" screen of src/screens/Login.tsx).
 * The role cards are radio inputs inside the form: their selected styling is pure CSS (has-checked),
 * and assets/auth.js updates the description, username label/placeholder, button colour and
 * "Forgot password?" link live. Without JS the form still posts the chosen role.
 * @var ?string $role @var string $username @var string $error
 */
$roles = roleOptions();
$isAdmin = $role === 'admin';
$current = $role !== null ? roleInfo($role) : null;
$usernameLabel = static fn (?string $id): string => $id === 'student' ? 'Student ID or email' : 'School email or username';
$usernamePlaceholder = static fn (?string $id): string => $id === 'student' ? 'Enter Student ID or email' : 'Enter school email or username';
$inputCls = 'w-full px-3 py-2.5 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] placeholder:text-[#BCCDD5] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/30 focus:border-[#2A9D8F] transition-all';
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
      <form method="post" action="<?= e(url('login')) ?>" data-login-form>
        <?= csrfField() ?>
        <?php if ($isAdmin): ?>
        <input type="hidden" name="role" value="admin">
        <p class="text-sm font-semibold mb-1" style="color: #264653">Administrator sign-in</p>
        <p class="text-xs mb-4"><a href="<?= e(url('login')) ?>" class="font-semibold hover:opacity-70 transition-opacity" style="color: #2A9D8F">Not an admin? Choose your role</a></p>
        <?php else: ?>
        <p id="login-role-label" class="text-sm font-semibold mb-3" style="color: #264653">I am a…</p>
        <div class="grid grid-cols-3 gap-2 mb-6" role="radiogroup" aria-labelledby="login-role-label">
          <?php foreach ($roles as $option): ?>
          <label class="group relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all border-[#E8EDF0] bg-white has-checked:border-[<?= e($option['color']) ?>] has-checked:bg-[<?= e($option['bg']) ?>] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#264653]">
            <input type="radio" name="role" value="<?= e($option['id']) ?>" class="sr-only"<?= $role === $option['id'] ? ' checked' : '' ?>
              data-color="<?= e($option['color']) ?>" data-bg="<?= e($option['bg']) ?>" data-description="<?= e($option['description']) ?>"
              data-label-text="<?= e($usernameLabel($option['id'])) ?>" data-placeholder-text="<?= e($usernamePlaceholder($option['id'])) ?>">
            <span class="text-xl"><?= e($option['emoji']) ?></span>
            <span class="text-xs font-semibold text-[#264653] group-has-checked:text-[<?= e($option['color']) ?>]"><?= e($option['label']) ?></span>
          </label>
          <?php endforeach ?>
        </div>

        <p class="text-xs text-center mb-4 px-2 py-1.5 rounded-lg" aria-live="polite" data-role-description<?= $current ? ' style="color: '.e($current['color']).'; background-color: '.e($current['bg']).'"' : ' hidden' ?>><?= e($current['description'] ?? '') ?></p>
        <?php endif ?>

        <div class="space-y-3 mt-2">
          <div>
            <label for="login-username" class="block text-xs font-semibold mb-1.5" style="color: #264653" data-role-label><?= e($usernameLabel($role)) ?></label>
            <input
              type="text"
              id="login-username"
              name="username"
              value="<?= e($username) ?>"
              placeholder="<?= e($usernamePlaceholder($role)) ?>"
              autocomplete="username"
              class="<?= $inputCls ?>"
            >
          </div>
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label for="login-password" class="block text-xs font-semibold" style="color: #264653">Password</label>
              <a href="<?= e(url('forgot-password', ['role' => $role ?? 'student'])) ?>" class="text-xs font-semibold hover:opacity-70 transition-opacity" style="color: #2A9D8F" data-forgot-link>Forgot password?</a>
            </div>
            <div class="relative">
              <input
                type="password"
                id="login-password"
                name="password"
                placeholder="Enter password"
                autocomplete="current-password"
                class="w-full px-3 py-2.5 pr-10 rounded-xl border border-[#E8EDF0] text-sm text-[#264653] placeholder:text-[#BCCDD5] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/30 focus:border-[#2A9D8F] transition-all"
              >
              <button type="button" data-password-toggle="#login-password" aria-label="Show password" class="absolute right-3 top-1/2 -translate-y-1/2 text-[#9BB5C0] hover:text-[#264653] transition-colors text-xs">👁️</button>
            </div>
          </div>

          <?php if ($error !== ''): ?>
          <p role="alert" class="text-xs text-[#E76F51] bg-[#FEF0EE] px-3 py-2 rounded-lg" data-error-for="role username password"><?= e($error) ?></p>
          <?php endif ?>

          <button
            type="submit"
            data-busy-text="Signing in…"
            data-busy-spinner
            data-role-submit
            class="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            style="background-color: <?= e($current['color'] ?? '#2A9D8F') ?>"
          >Sign In to BookSphere</button>
        </div>
      </form>
    </div>

    <!-- Create account link -->
    <p class="text-center text-sm mt-4" style="color: #6B8EA0">
      New to BookSphere? <a href="<?= e(url('register')) ?>" class="font-semibold hover:opacity-70 transition-opacity" style="color: #2A9D8F">Create an account</a>
    </p>
    <?php if (! $isAdmin): ?>
    <p class="text-center text-xs mt-2"><a href="<?= e(url('login', ['role' => 'admin'])) ?>" class="font-semibold hover:opacity-70 transition-opacity" style="color: #6B8EA0">Administrator sign-in</a></p>
    <?php endif ?>
  </div>
</div>
<script src="<?= e(asset('auth.js')) ?>" defer></script>
