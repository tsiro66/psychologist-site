<script>
  import Icon from "../Icon.svelte";
  let { formattedDate, selectedHour, onReset } = $props();
</script>

<div class="w-full max-w-md mx-auto text-center animate-step">
  <div
    class="bg-white/60 backdrop-blur-sm border border-stone-200 rounded-sm px-8 py-12"
  >
    <div
      class="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center"
    >
      <Icon name="check" class="w-8 h-8 text-primary-600" />
    </div>
    <h3 class="font-serif text-2xl text-neutral-950 mb-2">
      Η κράτηση καταχωρήθηκε!
    </h3>
    <p class="text-neutral-500 mb-1 capitalize">{formattedDate}</p>
    <p class="text-neutral-500 mb-6">Ώρα: {selectedHour}</p>
    <p class="text-sm text-neutral-400">
      Θα επικοινωνήσουμε μαζί σου σύντομα για επιβεβαίωση.
    </p>
    <button
      onclick={onReset}
      class="mt-6 text-sm font-semibold text-primary-700 hover:text-primary-800 transition-colors cursor-pointer"
    >
      Νέα κράτηση
    </button>
  </div>
</div>

<style>
  @keyframes stepIn {
    from {
      opacity: 0;
      transform: translateX(12px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .animate-step {
    animation: stepIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
</style>