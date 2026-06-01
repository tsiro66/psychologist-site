<script>
  let {
    title,
    message,
    confirmLabel = 'Διαγραφή',
    loading = false,
    onConfirm,
    onCancel,
  } = $props();
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center px-4">
  <button type="button" class="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default" aria-label="Κλείσιμο" onclick={onCancel}></button>
  <div class="relative bg-white rounded-sm w-full max-w-md shadow-xl">
    <div class="px-6 py-4 bg-dark-900">
      <h3 class="font-serif text-lg text-white">{title}</h3>
    </div>
    <div class="px-6 py-5">
      <p class="text-sm text-neutral-600">{message}</p>
    </div>
    <div class="px-6 py-4 border-t border-stone-200 flex gap-3 justify-end">
      <button
        onclick={onCancel}
        class="px-5 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
      >
        Ακύρωση
      </button>
      <button
        onclick={onConfirm}
        disabled={loading}
        class="px-5 py-2.5 text-sm font-semibold border border-red-500 text-red-500 hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
      >
        {loading ? '...' : confirmLabel}
      </button>
    </div>
  </div>
</div>
