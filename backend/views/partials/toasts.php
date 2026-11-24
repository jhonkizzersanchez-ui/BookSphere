<div id="toasts" class="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none"></div>
<script type="application/json" id="flash-toasts"><?= json_encode(takeToasts(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?></script>
