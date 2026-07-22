<script>
  import Icon from "../Icon.svelte";

  let {
    hours,
    bookedHours,
    selectedHour,
    loadingHours,
    hoursError = false,
    formattedDate,
    nowAthens = null,
    onSelectHour,
    onGoBack,
  } = $props();
</script>

<div class="animate-step">
  <div
    class="bg-white/60 backdrop-blur-sm border border-stone-200 rounded-sm overflow-hidden"
  >
    <div class="px-6 py-4 border-b border-stone-200 flex items-center gap-3">
      <button
        onclick={onGoBack}
        aria-label="Πίσω"
        class="p-1.5 -ml-1.5 text-neutral-400 hover:text-primary-700 transition-colors cursor-pointer"
      >
        <Icon name="chevron-left" />
      </button>
      <div>
        <p class="text-sm text-neutral-500">Ημερομηνία</p>
        <p class="font-serif text-lg text-neutral-950 capitalize">
          {formattedDate}
        </p>
      </div>
    </div>
    <div class="px-6 py-5">
      <p
        class="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4"
      >
        Επίλεξε ώρα
      </p>
      {#if loadingHours}
        <div class="text-center py-6 text-neutral-400 text-sm">
          Φόρτωση διαθέσιμων ωρών...
        </div>
      {:else if hoursError}
        <div class="text-center py-6 text-red-500 text-sm">
          Αποτυχία φόρτωσης διαθέσιμων ωρών. Επίλεξε άλλη ημέρα.
        </div>
      {:else}
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {#each hours as hour}
            {@const booked = bookedHours.includes(hour)}
            {@const past = nowAthens != null && hour <= nowAthens}
            {@const disabled = booked || past}
            <button
              onclick={() => onSelectHour(hour)}
              disabled={disabled}
              aria-pressed={selectedHour === hour}
              class="py-2.5 px-3 text-sm font-medium rounded-sm border transition-all duration-200
                {disabled
                ? 'border-stone-100 bg-stone-50 text-neutral-300 line-through cursor-not-allowed'
                : selectedHour === hour
                  ? 'bg-dark-900 border-dark-900 text-white shadow-md cursor-pointer'
                  : 'border-stone-200 text-neutral-700 hover:border-primary-300 hover:bg-primary-50 hover:text-dark-900 cursor-pointer'}"
            >
              {hour}
            </button>
          {/each}
        </div>
        {#if bookedHours.length === hours.length || (nowAthens != null && hours.every((h) => bookedHours.includes(h) || h <= nowAthens))}
          <p class="text-sm text-neutral-400 text-center mt-4">
            Δεν υπάρχουν διαθέσιμες ώρες. Επίλεξε άλλη ημέρα.
          </p>
        {/if}
      {/if}
    </div>
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