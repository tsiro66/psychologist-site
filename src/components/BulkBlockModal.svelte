<script>
  import { hours } from "../lib/booking-utils.js";
  import { trapFocus } from "../lib/modal.js";

  let { saving = false, externalError = "", onSave, onCancel } = $props();

  let mode = $state("date"); // "date" | "weekday"
  let date = $state("");
  let weekday = $state(1); // 0=Sun ... 6=Sat
  let selectedHours = $state(new Set());
  let loadingHours = $state(false);
  let loadSeq = 0;

  const weekdays = [
    { value: -1, label: "Όλες τις ημέρες" },
    { value: 1, label: "Δευτέρα" },
    { value: 2, label: "Τρίτη" },
    { value: 3, label: "Τετάρτη" },
    { value: 4, label: "Πέμπτη" },
    { value: 5, label: "Παρασκευή" },
    { value: 6, label: "Σάββατο" },
  ];

  function toggleHour(h) {
    const next = new Set(selectedHours);
    if (next.has(h)) next.delete(h);
    else next.add(h);
    selectedHours = next;
  }

  async function loadExistingHours() {
    if (mode === "date" && !date) return;
    const seq = ++loadSeq;
    loadingHours = true;
    try {
      const params = new URLSearchParams();
      if (mode === "date") params.set("date", date);
      else params.set("weekday", String(weekday));
      const res = await fetch(`/api/booking/bulk-block?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      if (seq !== loadSeq) return;
      selectedHours = new Set(data.hours ?? []);
    } catch {
      // ignore
    } finally {
      if (seq === loadSeq) loadingHours = false;
    }
  }

  let canSubmit = $derived.by(() => {
    if (saving || loadingHours) return false;
    if (mode === "date") return !!date;
    return true;
  });

  let previewLabel = $derived.by(() => {
    if (mode === "date" && date) {
      return new Date(date + "T00:00:00").toLocaleDateString("el-GR", {
        day: "numeric",
        month: "long",
      });
    }
    if (mode === "weekday") {
      return weekdays.find((w) => w.value === weekday)?.label ?? "";
    }
    return "";
  });

  function onModeChange(m) {
    mode = m;
    selectedHours = new Set();
    loadExistingHours();
  }

  function onDateChange() {
    selectedHours = new Set();
    loadExistingHours();
  }

  function onWeekdayChange() {
    selectedHours = new Set();
    loadExistingHours();
  }

  function handleSubmit() {
    if (!canSubmit) return;
    const payload = {
      hours: [...selectedHours],
    };
    if (mode === "date") {
      payload.date = date;
    } else {
      payload.weekday = weekday;
    }
    onSave(payload);
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center px-4">
  <button
    type="button"
    class="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default"
    aria-label="Κλείσιμο"
    onclick={onCancel}
  ></button>
  <div
    class="relative bg-white rounded-sm w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
    role="dialog"
    aria-modal="true"
    aria-labelledby="bulk-title"
    use:trapFocus
    oncancel={onCancel}
  >
    <div class="px-6 py-4 bg-dark-900">
      <h3 id="bulk-title" class="font-serif text-lg text-white">Μαζικές κρατήσεις ωρών</h3>
    </div>
    <div class="px-6 py-5 space-y-5">
      {#if externalError}
        <p class="text-sm text-red-600">{externalError}</p>
      {/if}

      <!-- Mode tabs -->
      <div class="flex border-b border-stone-200">
        <button
          type="button"
          onclick={() => onModeChange("date")}
          class="px-4 py-2 text-sm font-medium transition-colors cursor-pointer
            {mode === 'date'
            ? 'text-primary-700 border-b-2 border-primary-600'
            : 'text-neutral-500 hover:text-neutral-800'}"
        >
          Σειριακή ημερομηνία
        </button>
        <button
          type="button"
          onclick={() => onModeChange("weekday")}
          class="px-4 py-2 text-sm font-medium transition-colors cursor-pointer
            {mode === 'weekday'
            ? 'text-primary-700 border-b-2 border-primary-600'
            : 'text-neutral-500 hover:text-neutral-800'}"
        >
          Ημέρα εβδομάδας
        </button>
      </div>

      <!-- Date mode -->
      {#if mode === "date"}
        <div>
          <label
            for="bulk-date"
            class="block text-sm text-neutral-600 mb-1.5">Ημερομηνία</label
          >
          <input
            id="bulk-date"
            type="date"
            bind:value={date}
            onchange={onDateChange}
            class="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-sm text-neutral-950 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-colors"
          />
        </div>
      {:else}
        <div>
          <label
            for="bulk-weekday"
            class="block text-sm text-neutral-600 mb-1.5">Ημέρα εβδομάδας</label
          >
          <select
            id="bulk-weekday"
            bind:value={weekday}
            onchange={onWeekdayChange}
            class="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-sm text-neutral-950 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-colors"
          >
            {#each weekdays as w}
              <option value={w.value}>{w.label}</option>
            {/each}
          </select>
        </div>
      {/if}

      <div>
        <p
          class="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3"
        >
          Ώρες προς κράτηση
        </p>
        <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {#each hours as h}
            <button
              type="button"
              onclick={() => toggleHour(h)}
              aria-pressed={selectedHours.has(h)}
              class="py-2.5 px-3 text-sm font-medium rounded-sm border transition-all duration-200 cursor-pointer
                {selectedHours.has(h)
                ? 'bg-dark-900 border-dark-900 text-white shadow-md'
                : 'border-stone-200 text-neutral-700 hover:border-primary-300 hover:bg-primary-50 hover:text-dark-900'}"
            >
              {h}
            </button>
          {/each}
        </div>
      </div>

      {#if loadingHours}
        <p class="text-sm text-neutral-400">Φόρτωση υπαρχόντων κρατήσεων...</p>
      {/if}

      {#if selectedHours.size > 0}
        <p class="text-sm text-neutral-500">
          {#if mode === "weekday"}
            Κρατούνται <span class="font-semibold text-neutral-900">{selectedHours.size}</span>
            ώρες {weekday === -1 ? "κάθε μέρα" : `κάθε ${previewLabel}`}. 
          {:else}
            Κρατούνται <span class="font-semibold text-neutral-900">{selectedHours.size}</span>
            ώρες στις <span class="font-semibold text-neutral-900">{previewLabel}</span>.
          {/if}
        </p>
      {:else}
        <p class="text-sm text-neutral-500">
          {#if mode === "weekday"}
            Όλες οι ώρες είναι ελεύθερες {weekday === -1 ? "κάθε μέρα" : `κάθε ${previewLabel}`}.
          {:else if previewLabel}
            Όλες οι ώρες είναι ελεύθερες στις <span class="font-semibold text-neutral-900">{previewLabel}</span>.
          {/if}
        </p>
      {/if}
    </div>
    <div class="px-6 py-4 border-t border-stone-200 flex gap-3 justify-end">
      <button
        onclick={onCancel}
        class="px-5 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
      >
        Ακύρωση
      </button>
      <button
        onclick={handleSubmit}
        disabled={!canSubmit}
        class="px-5 py-2.5 text-sm font-semibold border border-primary-600 text-primary-600 hover:bg-primary-700 hover:border-primary-700 hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? "Αποστολή..." : "Αποθήκευση"}
      </button>
    </div>
  </div>
</div>