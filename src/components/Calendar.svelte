<script>
  import { onMount } from "svelte";
  import Icon from "./Icon.svelte";
  import { hours } from "../lib/booking-utils.js";
  import BookingSuccess from "./calendar/BookingSuccess.svelte";
  import DateStep from "./calendar/DateStep.svelte";
  import HourStep from "./calendar/HourStep.svelte";
  import ContactStep from "./calendar/ContactStep.svelte";

  let viewDate = $state(new Date());
  let selectedDate = $state(null);
  let selectedHour = $state(null);
  let name = $state("");
  let phone = $state("");
  let submitting = $state(false);
  let submitted = $state(false);
  let errorMsg = $state("");
  let step = $state(1);
  let bookedHours = $state([]);
  let loadingHours = $state(false);

  let _now = $state(Date.now());
  let today = $derived.by(() => {
    const d = new Date(_now);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  onMount(() => {
    const refresh = () => {
      _now = Date.now();
    };
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  });

  function canGoPrev() {
    const prev = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return prev >= currentMonth;
  }

  function canGoNext() {
    const max = new Date(today.getFullYear(), today.getMonth() + 3, 1);
    return new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1) <= max;
  }

  function prevMonth() {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
  }

  function nextMonth() {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  }

  async function selectDate(day) {
    selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    selectedHour = null;
    step = 2;
    loadingHours = true;
    bookedHours = [];
    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
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

  let formattedDate = $derived(
    selectedDate
      ? selectedDate.toLocaleDateString("el-GR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null,
  );

  let isoDate = $derived(
    selectedDate
      ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
      : null,
  );

  function isValidPhone(p) {
    return /^\d{10}$/.test(p.trim());
  }

  let phoneInvalid = $derived(phone.trim().length > 0 && !isValidPhone(phone));
  let canSubmit = $derived(
    selectedDate &&
      selectedHour &&
      name.trim() &&
      isValidPhone(phone) &&
      !submitting,
  );

  async function handleSubmit() {
    if (!canSubmit) return;
    submitting = true;
    errorMsg = "";

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          date: isoDate,
          hour: selectedHour,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        errorMsg = data.error || "Κάτι πήγε στραβά. Δοκίμασε ξανά.";
        return;
      }

      submitted = true;
    } catch {
      errorMsg = "Κάτι πήγε στραβά. Δοκίμασε ξανά.";
    } finally {
      submitting = false;
    }
  }

  function reset() {
    submitted = false;
    selectedDate = null;
    selectedHour = null;
    name = "";
    phone = "";
    errorMsg = "";
    step = 1;
    bookedHours = [];
  }
</script>

{#if submitted}
  <BookingSuccess {formattedDate} {selectedHour} onReset={reset} />
{:else}
  <div class="w-full max-w-md mx-auto">
    <!-- Progress Steps -->
    <div class="flex items-center justify-center gap-2 mb-6">
      {#each [1, 2, 3] as s}
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
            {s < step
              ? 'bg-primary-600 text-white'
              : s === step
                ? 'bg-dark-900 text-white'
                : 'bg-stone-100 text-neutral-400'}"
          >
            {#if s < step}
              <Icon name="check" class="w-4 h-4" strokeWidth={2.5} />
            {:else}
              {s}
            {/if}
          </div>
          {#if s < 3}
            <div
              class="w-10 h-0.5 transition-all duration-300 {s < step
                ? 'bg-primary-600'
                : 'bg-stone-200'}"
            ></div>
          {/if}
        </div>
      {/each}
    </div>

    {#if step === 1}
      <DateStep
        {viewDate}
        {today}
        {selectedDate}
        canGoPrev={canGoPrev()}
        canGoNext={canGoNext()}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onSelectDate={selectDate}
      />
    {/if}

    {#if step === 2}
      <HourStep
        {hours}
        {bookedHours}
        {selectedHour}
        {loadingHours}
        {formattedDate}
        onSelectHour={selectHour}
        onGoBack={goBack}
      />
    {/if}

    {#if step === 3}
      <ContactStep
        {formattedDate}
        {selectedHour}
        bind:name
        bind:phone
        {phoneInvalid}
        {errorMsg}
        {submitting}
        {canSubmit}
        onSubmit={handleSubmit}
        onGoBack={goBack}
      />
    {/if}
  </div>
{/if}