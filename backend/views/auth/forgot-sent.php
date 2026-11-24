<?php
/** "Reset link requested" screen (ported from the "forgot-sent" screen of src/screens/Login.tsx). */
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

    <div class="bg-white rounded-2xl border border-[#E8EDF0] p-8 text-center">
      <h2 class="text-xl font-bold text-[#264653] mb-3">Reset link requested</h2>
      <p class="text-sm text-[#6B8EA0] mb-6">If an account exists for that email, a reset link has been requested. Check your inbox or contact the library.</p>
      <a href="<?= e(url('login')) ?>" class="block w-full py-3 rounded-xl text-sm font-bold text-white bg-[#2A9D8F]">Back to sign in</a>
    </div>
  </div>
</div>
