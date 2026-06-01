<script>
  import { formatDate, isPast } from '../lib/booking-utils.js';

  let { booking, deleting, onEdit, onDelete } = $props();
</script>

<div class="px-5 py-4 {isPast(booking.date, booking.hour) ? 'opacity-50' : ''}">
  <div class="flex justify-between items-start mb-2">
    <div>
      <p class="text-sm font-medium text-neutral-950">{booking.name}</p>
      <p class="text-sm text-neutral-500">{booking.phone}</p>
    </div>
    <div class="flex gap-3">
      <button
        onclick={() => onEdit(booking)}
        class="text-sm text-primary-500 hover:text-primary-700 transition-colors cursor-pointer"
      >
        Επεξ.
      </button>
      <button
        onclick={() => onDelete(booking.id)}
        disabled={deleting === booking.id}
        class="text-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-40"
      >
        {deleting === booking.id ? '...' : 'Διαγραφή'}
      </button>
    </div>
  </div>
  <p class="text-sm text-neutral-700 capitalize">{formatDate(booking.date)} · <span class="font-medium">{booking.hour}</span></p>
</div>
