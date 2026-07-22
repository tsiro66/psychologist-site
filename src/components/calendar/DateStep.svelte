<script>
  import Icon from "../Icon.svelte";

  let {
    viewDate,
    today,
    selectedDate,
    canGoPrev,
    canGoNext,
    onPrevMonth,
    onNextMonth,
    onSelectDate,
  } = $props();

  const days = ["Δε", "Τρ", "Τε", "Πε", "Πα", "Σα", "Κυ"];

  let daysInMonth = $derived(
    new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate(),
  );
  let startDay = $derived.by(() => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
    return d === 0 ? 6 : d - 1;
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

  function isSunday(day) {
    const d = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      day,
    ).getDay();
    return d === 0;
  }

  function isSelected(day) {
    return (
      selectedDate?.getDate() === day &&
      selectedDate?.getMonth() === viewDate.getMonth() &&
      selectedDate?.getFullYear() === viewDate.getFullYear()
    );
  }
</script>

<div class="animate-step">
  <div
    class="bg-white/60 backdrop-blur-sm border border-stone-200 rounded-sm overflow-hidden"
  >
    <div class="flex justify-between items-center px-6 py-5 bg-dark-900">
      <h2 class="font-serif text-xl text-white capitalize">
        {viewDate.toLocaleDateString("el-GR", {
          month: "long",
          year: "numeric",
        })}
      </h2>
      <div class="flex gap-1">
        <button
          onclick={onPrevMonth}
          disabled={!canGoPrev}
          aria-label="Προηγούμενος μήνας"
          title="Προηγούμενος μήνας"
          class="p-2 text-primary-300 hover:text-accent-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <Icon name="chevron-left" />
        </button>
        <button
          onclick={onNextMonth}
          disabled={!canGoNext}
          aria-label="Επόμενος μήνας"
          title="Επόμενος μήνας"
          class="p-2 text-primary-300 hover:text-accent-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <Icon name="chevron-right" />
        </button>
      </div>
    </div>

    <div class="px-4 pt-4 pb-5">
      <div class="grid grid-cols-7 gap-1 text-center mb-1">
        {#each days as d}
          <div
            class="text-xs font-semibold text-neutral-400 uppercase tracking-wider py-2"
          >
            {d}
          </div>
        {/each}
      </div>

      <div class="grid grid-cols-7 gap-1 text-center">
        {#each Array(startDay) as _}
          <div class="p-2"></div>
        {/each}

        {#each Array.from({ length: daysInMonth }, (_, i) => i + 1) as day}
          <button
            onclick={() => onSelectDate(day)}
            disabled={isPast(day) || isSunday(day)}
            aria-label={new Date(
              viewDate.getFullYear(),
              viewDate.getMonth(),
              day,
            ).toLocaleDateString("el-GR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            class="relative p-2 text-sm rounded-sm transition-all duration-200 cursor-pointer
              {isSelected(day)
              ? 'bg-dark-900 text-white font-semibold shadow-md'
              : isPast(day) || isSunday(day)
                ? 'text-neutral-300 cursor-not-allowed'
                : isToday(day)
                  ? 'bg-primary-50 text-primary-700 font-semibold hover:bg-primary-100'
                  : 'text-neutral-700 hover:bg-primary-50 hover:text-dark-900'}"
          >
            {day}
            {#if isToday(day)}
              <span
                class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500"
              ></span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <p class="text-center text-sm text-neutral-400 mt-4">Επίλεξε ημερομηνία</p>
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