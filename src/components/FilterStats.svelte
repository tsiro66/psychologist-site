<script>
  let { counts, filter, onFilterChange } = $props();

  const filters = [
    { key: 'all', label: 'Συνολο', valueColor: 'text-neutral-950', activeBorder: 'border-primary-400 ring-1 ring-primary-400' },
    { key: 'upcoming', label: 'Επερχομενες', valueColor: 'text-primary-600', activeBorder: 'border-accent-400 ring-1 ring-accent-400' },
    { key: 'past', label: 'Παρελθουσες', valueColor: 'text-neutral-400', activeBorder: 'border-neutral-400 ring-1 ring-neutral-400' },
  ];
</script>

<div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
  {#each filters as f}
    <button
      onclick={() => onFilterChange(f.key)}
      class="bg-white/60 backdrop-blur-sm border rounded-sm px-5 py-4 text-left cursor-pointer transition-all
        {filter === f.key ? f.activeBorder : 'border-stone-200 hover:border-stone-300'}"
    >
      <p class="text-sm text-neutral-500 uppercase tracking-wider font-semibold">{f.label}</p>
      <p class="text-3xl font-serif {f.valueColor} mt-1">{counts[f.key]}</p>
    </button>
  {/each}
</div>
