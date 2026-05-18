<script>
  import { onMount } from 'svelte';

  let viewDate = $state(new Date());
  let selectedDate = $state(null);
  let selectedHour = $state(null);
  let name = $state('');
  let phone = $state('');
  let submitting = $state(false);
  let submitted = $state(false);
  let errorMsg = $state('');
  let step = $state(1);
  let bookedHours = $state([]);
  let loadingHours = $state(false);

  let daysInMonth = $derived(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate());
  let startDay = $derived.by(() => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    return d === 0 ? 6 : d - 1;
  });

  const days = ["Δε", "Τρ", "Τε", "Πε", "Πα", "Σα", "Κυ"];
  const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  let _now = $state(Date.now());
  let today = $derived.by(() => {
    const d = new Date(_now);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  onMount(() => {
    const refresh = () => { _now = Date.now(); };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  });

  function isPast(day) {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    d.setHours(0, 0, 0, 0);
    return d < today;
  }

  function isToday(day) {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }

  function isWeekend(day) {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day).getDay();
    return d === 0 || d === 6;
  }

  function isSelected(day) {
    return selectedDate?.getDate() === day && selectedDate?.getMonth() === viewDate.getMonth() && selectedDate?.getFullYear() === viewDate.getFullYear();
  }

  async function selectDate(day) {
    if (isPast(day) || isWeekend(day)) return;
    selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    selectedHour = null;
    step = 2;
    loadingHours = true;
    bookedHours = [];
    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const res = await fetch(`/api/booking?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        bookedHours = data.bookedHours ?? [];
      }
    } catch {}
    loadingHours = false;
  }

  function selectHour(hour) {
    selectedHour = hour;
    step = 3;
  }

  function goBack() {
    if (step === 2) {
      step = 1;
    } else if (step === 3) {
      step = 2;
    }
  }

  function prevMonth() {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  }

  function nextMonth() {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  }

  function canGoPrev() {
    const prev = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return prev >= currentMonth;
  }

  function canGoNext() {
    const max = new Date(today.getFullYear(), today.getMonth() + 3, 1);
    return new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1) <= max;
  }

  let formattedDate = $derived(
    selectedDate
      ? selectedDate.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : null
  );

  let shortDate = $derived(
    selectedDate
      ? selectedDate.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' })
      : null
  );

  let isoDate = $derived(
    selectedDate
      ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
      : null
  );

  function isValidPhone(p) {
    return /^\d{10}$/.test(p.trim());
  }

  let phoneInvalid = $derived(phone.trim().length > 0 && !isValidPhone(phone));
  let canSubmit = $derived(selectedDate && selectedHour && name.trim() && isValidPhone(phone) && !submitting);

  async function handleSubmit() {
    if (!canSubmit) return;
    submitting = true;
    errorMsg = '';

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          date: isoDate,
          hour: selectedHour,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        errorMsg = data.error || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.';
        return;
      }

      submitted = true;
    } catch {
      errorMsg = 'Κάτι πήγε στραβά. Δοκίμασε ξανά.';
    } finally {
      submitting = false;
    }
  }

  function reset() {
    submitted = false;
    selectedDate = null;
    selectedHour = null;
    name = '';
    phone = '';
    errorMsg = '';
    step = 1;
    bookedHours = [];
  }
</script>

{#if submitted}
  <div class="w-full max-w-md mx-auto text-center animate-step">
    <div class="bg-white/60 backdrop-blur-sm border border-stone-200 rounded-sm px-8 py-12">
      <div class="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
        <svg class="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <h3 class="font-serif text-2xl text-neutral-950 mb-2">Η κράτηση καταχωρήθηκε!</h3>
      <p class="text-neutral-500 mb-1 capitalize">{formattedDate}</p>
      <p class="text-neutral-500 mb-6">Ώρα: {selectedHour}</p>
      <p class="text-sm text-neutral-400">Θα επικοινωνήσουμε μαζί σου σύντομα για επιβεβαίωση.</p>
      <button
        onclick={reset}
        class="mt-6 text-sm font-semibold text-primary-700 hover:text-primary-800 transition-colors cursor-pointer"
      >
        Νέα κράτηση
      </button>
    </div>
  </div>
{:else}
  <div class="w-full max-w-md mx-auto">
    <!-- Progress Steps -->
    <div class="flex items-center justify-center gap-2 mb-6">
      {#each [1, 2, 3] as s}
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
            {s < step
              ? 'bg-primary-600 text-white'
              : s === step
                ? 'bg-dark-900 text-white'
                : 'bg-stone-100 text-neutral-400'}">
            {#if s < step}
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            {:else}
              {s}
            {/if}
          </div>
          {#if s < 3}
            <div class="w-10 h-0.5 transition-all duration-300 {s < step ? 'bg-primary-600' : 'bg-stone-200'}"></div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Step 1: Date Selection -->
    {#if step === 1}
      <div class="animate-step">
        <div class="bg-white/60 backdrop-blur-sm border border-stone-200 rounded-sm overflow-hidden">
          <div class="flex justify-between items-center px-6 py-5 bg-dark-900">
            <h2 class="font-serif text-xl text-white capitalize">
              {viewDate.toLocaleDateString('el-GR', { month: 'long', year: 'numeric' })}
            </h2>
            <div class="flex gap-1">
              <button
                onclick={prevMonth}
                disabled={!canGoPrev()}
                aria-label="Προηγούμενος μήνας"
                title="Προηγούμενος μήνας"
                class="p-2 text-primary-300 hover:text-accent-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onclick={nextMonth}
                disabled={!canGoNext()}
                aria-label="Επόμενος μήνας"
                title="Επόμενος μήνας"
                class="p-2 text-primary-300 hover:text-accent-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>

          <div class="px-4 pt-4 pb-5">
            <div class="grid grid-cols-7 gap-1 text-center mb-1">
              {#each days as d}
                <div class="text-xs font-semibold text-neutral-400 uppercase tracking-wider py-2">{d}</div>
              {/each}
            </div>

            <div class="grid grid-cols-7 gap-1 text-center">
              {#each Array(startDay) as _}
                <div class="p-2"></div>
              {/each}

              {#each Array.from({ length: daysInMonth }, (_, i) => i + 1) as day}
                <button
                  onclick={() => selectDate(day)}
                  disabled={isPast(day) || isWeekend(day)}
                  aria-label={new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  class="relative p-2 text-sm rounded-sm transition-all duration-200 cursor-pointer
                    {isSelected(day)
                      ? 'bg-dark-900 text-white font-semibold shadow-md'
                      : isPast(day) || isWeekend(day)
                        ? 'text-neutral-300 cursor-not-allowed'
                        : isToday(day)
                          ? 'bg-primary-50 text-primary-700 font-semibold hover:bg-primary-100'
                          : 'text-neutral-700 hover:bg-primary-50 hover:text-dark-900'}"
                >
                  {day}
                  {#if isToday(day)}
                    <span class="absolute bottom-0.5 left-1/2 -trandark-x-1/2 w-1 h-1 rounded-full bg-primary-500"></span>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        </div>

        <p class="text-center text-sm text-neutral-400 mt-4">Επίλεξε ημερομηνία</p>
      </div>
    {/if}

    <!-- Step 2: Hour Selection -->
    {#if step === 2}
      <div class="animate-step">
        <div class="bg-white/60 backdrop-blur-sm border border-stone-200 rounded-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-stone-200 flex items-center gap-3">
            <button
              onclick={goBack}
              aria-label="Πίσω"
              class="p-1.5 -ml-1.5 text-neutral-400 hover:text-primary-700 transition-colors cursor-pointer"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <p class="text-sm text-neutral-500">Ημερομηνία</p>
              <p class="font-serif text-lg text-neutral-950 capitalize">{formattedDate}</p>
            </div>
          </div>
          <div class="px-6 py-5">
            <p class="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">Επίλεξε ώρα</p>
            {#if loadingHours}
              <div class="text-center py-6 text-neutral-400 text-sm">Φόρτωση διαθέσιμων ωρών...</div>
            {:else}
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {#each hours as hour}
                  {@const booked = bookedHours.includes(hour)}
                  <button
                    onclick={() => selectHour(hour)}
                    disabled={booked}
                    aria-pressed={selectedHour === hour}
                    class="py-2.5 px-3 text-sm font-medium rounded-sm border transition-all duration-200
                      {booked
                        ? 'border-stone-100 bg-stone-50 text-neutral-300 line-through cursor-not-allowed'
                        : selectedHour === hour
                          ? 'bg-dark-900 border-dark-900 text-white shadow-md cursor-pointer'
                          : 'border-stone-200 text-neutral-700 hover:border-primary-300 hover:bg-primary-50 hover:text-dark-900 cursor-pointer'}"
                  >
                    {hour}
                  </button>
                {/each}
              </div>
              {#if bookedHours.length === hours.length}
                <p class="text-sm text-neutral-400 text-center mt-4">Δεν υπάρχουν διαθέσιμες ώρες. Επίλεξε άλλη ημέρα.</p>
              {/if}
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Step 3: Contact Details -->
    {#if step === 3}
      <div class="animate-step">
        <div class="bg-white/60 backdrop-blur-sm border border-stone-200 rounded-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-stone-200 flex items-center gap-3">
            <button
              onclick={goBack}
              aria-label="Πίσω"
              class="p-1.5 -ml-1.5 text-neutral-400 hover:text-primary-700 transition-colors cursor-pointer"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <p class="text-sm text-neutral-500 capitalize">{formattedDate}</p>
              <p class="font-serif text-lg text-neutral-950">{selectedHour}</p>
            </div>
          </div>
          <div class="px-6 py-5 space-y-4">
            <p class="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Στοιχεία επικοινωνίας</p>
            <div>
              <label for="booking-name" class="block text-sm text-neutral-600 mb-1.5">Ονοματεπώνυμο</label>
              <input
                id="booking-name"
                type="text"
                bind:value={name}
                placeholder="π.χ. Μαρία Παπαδοπούλου"
                class="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-sm text-neutral-950 placeholder:text-neutral-400 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-colors"
              />
            </div>
            <div>
              <label for="booking-phone" class="block text-sm text-neutral-600 mb-1.5">Τηλέφωνο</label>
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
            onclick={handleSubmit}
            disabled={!canSubmit}
            class="w-full py-3.5 px-7 text-sm font-semibold border border-primary-600 text-primary-600 hover:bg-primary-700 hover:border-primary-700 hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {#if submitting}
              Αποστολή...
            {:else}
              Κράτηση
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}

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
