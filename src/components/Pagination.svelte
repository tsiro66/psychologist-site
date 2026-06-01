<script>
  let { page, totalPages, total, perPage, onPageChange } = $props();
</script>

{#if totalPages > 1}
  <div class="px-6 py-3 border-t border-stone-200 flex items-center justify-between">
    <p class="text-sm text-neutral-500">
      {page * perPage + 1}–{Math.min((page + 1) * perPage, total)} από {total}
    </p>
    <div class="flex gap-1">
      <button
        onclick={() => onPageChange(page - 1)}
        disabled={page === 0}
        class="px-3 py-1.5 text-sm border border-stone-200 rounded-sm cursor-pointer transition-colors hover:bg-stone-50 disabled:opacity-30 disabled:cursor-default"
      >
        ←
      </button>
      {#each Array.from({ length: totalPages }, (_, i) => i) as p}
        {#if totalPages <= 7 || p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 1}
          <button
            onclick={() => onPageChange(p)}
            class="px-3 py-1.5 text-sm border rounded-sm cursor-pointer transition-colors
              {p === page ? 'border-primary-400 bg-primary-50 text-primary-700 font-semibold' : 'border-stone-200 hover:bg-stone-50'}"
          >
            {p + 1}
          </button>
        {:else if p === 1 || p === totalPages - 2}
          <span class="px-2 py-1.5 text-sm text-neutral-400">…</span>
        {/if}
      {/each}
      <button
        onclick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        class="px-3 py-1.5 text-sm border border-stone-200 rounded-sm cursor-pointer transition-colors hover:bg-stone-50 disabled:opacity-30 disabled:cursor-default"
      >
        →
      </button>
    </div>
  </div>
{/if}
