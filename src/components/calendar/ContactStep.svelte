<script>
  import Icon from "../Icon.svelte";

  let {
    formattedDate,
    selectedHour,
    name = $bindable(""),
    phone = $bindable(""),
    phoneInvalid,
    errorMsg,
    submitting,
    canSubmit,
    onSubmit,
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
        <p class="text-sm text-neutral-500 capitalize">{formattedDate}</p>
        <p class="font-serif text-lg text-neutral-950">{selectedHour}</p>
      </div>
    </div>
    <div class="px-6 py-5 space-y-4">
      <p class="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
        Στοιχεία επικοινωνίας
      </p>
      <div>
        <label for="booking-name" class="block text-sm text-neutral-600 mb-1.5"
          >Ονοματεπώνυμο</label
        >
        <input
          id="booking-name"
          type="text"
          bind:value={name}
          placeholder="π.χ. Μαρία Παπαδοπούλου"
          class="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-sm text-neutral-950 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-colors"
        />
      </div>
      <div>
        <label for="booking-phone" class="block text-sm text-neutral-600 mb-1.5"
          >Τηλέφωνο</label
        >
        <input
          id="booking-phone"
          type="tel"
          bind:value={phone}
          placeholder="π.χ. 6912345678"
          class="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-sm text-neutral-950 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-colors"
        />
        {#if phoneInvalid}
          <p class="text-xs text-red-500 mt-1">Εισάγετε 10ψήφιο τηλέφωνο</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="mt-4">
    {#if errorMsg}
      <p class="text-sm text-red-600 mb-3" aria-live="polite">{errorMsg}</p>
    {/if}
    <button
      onclick={onSubmit}
      disabled={!canSubmit}
      class="w-full py-3.5 px-7 text-sm font-semibold border border-primary-600 text-primary-600 hover:bg-primary-700 hover:border-primary-700 hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {#if submitting} Αποστολή... {:else} Κράτηση {/if}
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