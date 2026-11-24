<?php
/**
 * Sign-up screen (ported from the "signup" screen of src/screens/Login.tsx).
 * Each role shows different fields, so the role cards are links to ?role=… instead of buttons.
 * @var string $role @var array $old @var array $errors @var string $formError
 */
$roles = roleOptions();
$current = $roles[$role] ?? $roles['student'];
$role = $current['id'];
$old += array_fill_keys(['fullName', 'studentId', 'email', 'grade', 'classCode', 'staffId', 'password', 'confirmPassword'], '');
$inputCls = static fn (bool $hasError): string => 'w-full px-3 py-2.5 rounded-xl border text-sm text-[#264653] placeholder:text-[#BCCDD5] focus:outline-none focus:ring-2 transition-all '
    .($hasError ? 'border-[#E76F51] focus:ring-[#E76F51]/20' : 'border-[#E8EDF0] focus:ring-[#2A9D8F]/30 focus:border-[#2A9D8F]');
/** class + aria attributes for a control; error styling when the server rejected that field (auth.js restores data-ok-class on edit). */
$control = static function (string $name) use ($errors, $inputCls): string {
    if ((string) ($errors[$name] ?? '') === '') {
        return 'class="'.$inputCls(false).'"';
    }
    return 'class="'.$inputCls(true).'" aria-invalid="true" aria-describedby="signup-'.$name.'-error" data-ok-class="'.$inputCls(false).'"';
};
$fieldError = static function (string $name) use ($errors): string {
    $message = (string) ($errors[$name] ?? '');
    return $message === '' ? '' : '<p id="signup-'.$name.'-error" data-error-for="'.$name.'" class="text-[11px] mt-1 font-medium" style="color: #E76F51">'.e($message).'</p>';
};
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
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style="background-color: #E8F5F3">✨</div>
        <div>
          <h2 class="text-lg font-bold" style="<?= BALOO ?> color: #264653">Create your account</h2>
          <p class="text-xs" style="color: #6B8EA0">Join the Westview Academy library.</p>
        </div>
      </div>

      <!-- Role selector -->
      <p class="text-xs font-semibold mb-2" style="color: #264653">I am a…</p>
      <div class="grid grid-cols-3 gap-2 mb-5">
        <?php foreach ($roles as $option): $active = $option['id'] === $role; ?>
        <a
          href="<?= e(url('register', ['role' => $option['id']])) ?>"
          class="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all"
          style="border-color: <?= e($active ? $option['color'] : '#E8EDF0') ?>; background-color: <?= e($active ? $option['bg'] : 'white') ?>"
          <?= $active ? 'aria-current="true"' : '' ?>
        >
          <span class="text-xl"><?= e($option['emoji']) ?></span>
          <span class="text-xs font-semibold" style="color: <?= e($active ? $option['color'] : '#264653') ?>"><?= e($option['label']) ?></span>
        </a>
        <?php endforeach ?>
      </div>

      <form method="post" action="<?= e(url('register')) ?>" class="space-y-3">
        <?= csrfField() ?>
        <input type="hidden" name="role" value="<?= e($role) ?>">

        <!-- Full name — all roles -->
        <div>
          <label class="block" style="color: #264653">
            <span class="block text-xs font-semibold mb-1.5">Full Name</span>
            <input name="fullName" value="<?= e($old['fullName']) ?>" placeholder="e.g. Jordan Lee" <?= $control('fullName') ?>>
          </label>
          <?= $fieldError('fullName') ?>
        </div>

        <?php if ($role === 'student'): ?>
        <!-- Student fields -->
        <div>
          <label class="block" style="color: #264653">
            <span class="block text-xs font-semibold mb-1.5">Student ID</span>
            <input name="studentId" value="<?= e($old['studentId']) ?>" placeholder="e.g. 202407042" <?= $control('studentId') ?>>
          </label>
          <?= $fieldError('studentId') ?>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block" style="color: #264653">
              <span class="block text-xs font-semibold mb-1.5">Grade</span>
              <select name="grade" <?= $control('grade') ?>>
                <option value="">Select grade</option>
                <?php for ($grade = 1; $grade <= 12; $grade++): ?>
                <option value="<?= $grade ?>"<?= (string) $old['grade'] === (string) $grade ? ' selected' : '' ?>>Grade <?= $grade ?></option>
                <?php endfor ?>
              </select>
            </label>
            <?= $fieldError('grade') ?>
          </div>
          <div>
            <label class="block" style="color: #264653">
              <span class="block text-xs font-semibold mb-1.5">Class (optional)</span>
              <input name="classCode" value="<?= e($old['classCode']) ?>" placeholder="e.g. 7B" <?= $control('classCode') ?>>
            </label>
            <?= $fieldError('classCode') ?>
          </div>
        </div>
        <?php endif ?>

        <div>
          <label class="block" style="color: #264653">
            <span class="block text-xs font-semibold mb-1.5">School Email</span>
            <input type="email" name="email" value="<?= e($old['email']) ?>" placeholder="Your school email" autocomplete="email" <?= $control('email') ?>>
          </label>
          <?= $fieldError('email') ?>
        </div>

        <?php if ($role === 'librarian'): ?>
        <div>
          <label class="block" style="color: #264653">
            <span class="block text-xs font-semibold mb-1.5">Staff ID</span>
            <input name="staffId" value="<?= e($old['staffId']) ?>" placeholder="e.g. STAFF-2024-08" <?= $control('staffId') ?>>
          </label>
          <?= $fieldError('staffId') ?>
        </div>
        <?php endif ?>

        <!-- Password (never echoed back) -->
        <div>
          <label class="block" style="color: #264653">
            <span class="block text-xs font-semibold mb-1.5">Password</span>
            <input type="password" name="password" placeholder="12+ characters with letters and numbers" autocomplete="new-password" <?= $control('password') ?>>
          </label>
          <?= $fieldError('password') ?>
        </div>
        <div>
          <label class="block" style="color: #264653">
            <span class="block text-xs font-semibold mb-1.5">Confirm Password</span>
            <input type="password" name="confirmPassword" placeholder="Repeat your password" autocomplete="new-password" <?= $control('confirmPassword') ?>>
          </label>
          <?= $fieldError('confirmPassword') ?>
        </div>

        <?php if ($role !== 'student'): ?>
        <!-- Approval note for staff -->
        <div class="flex items-start gap-2 px-3 py-2.5 rounded-xl" style="background-color: #EEF0FD">
          <span class="text-sm flex-shrink-0 mt-0.5">ℹ️</span>
          <p class="text-[11px] leading-relaxed" style="color: #2B47CE"><?= $role === 'teacher'
              ? 'Teacher accounts require approval from the school librarian before activation.'
              : 'Librarian accounts require approval from an existing librarian.' ?></p>
        </div>
        <?php endif ?>

        <?php if ($formError !== ''): ?>
        <p role="alert" class="text-xs text-[#E76F51] bg-[#FEF0EE] px-3 py-2 rounded-lg"><?= e($formError) ?></p>
        <?php endif ?>
        <button
          type="submit"
          data-busy-text="Creating account…"
          data-busy-spinner
          class="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          style="background-color: <?= e($current['color']) ?>"
        >Create Account</button>
      </form>

      <p class="text-center text-sm mt-4" style="color: #6B8EA0">
        Already have an account? <a href="<?= e(url('login')) ?>" class="font-semibold hover:opacity-70 transition-opacity" style="color: #2A9D8F">Sign in</a>
      </p>
    </div>
  </div>
</div>
<script src="<?= e(asset('auth.js')) ?>" defer></script>
