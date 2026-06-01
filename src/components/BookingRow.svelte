<script>
  import { formatDate, isPast } from '../lib/booking-utils.js';

  let { booking, deleting, onEdit, onDelete } = $props();
</script>

<tr class="border-b border-stone-100 last:border-0 {isPast(booking.date, booking.hour) ? 'opacity-50' : ''}">
  <td class="px-6 py-4 text-sm text-neutral-950 capitalize">{formatDate(booking.date)}</td>
  <td class="px-6 py-4 text-sm text-neutral-950 font-medium">{booking.hour}</td>
  <td class="px-6 py-4 text-sm text-neutral-950">{booking.name}</td>
  <td class="px-6 py-4 text-sm text-neutral-600">{booking.phone}</td>
  <td class="px-6 py-4 text-right space-x-3">
    <button
      onclick={() => onEdit(booking)}
      class="text-sm text-primary-500 hover:text-primary-700 transition-colors cursor-pointer"
    >
      Επεξεργασία
    </button>
    <button
      onclick={() => onDelete(booking.id)}
      disabled={deleting === booking.id}
      class="text-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-40"
    >
      {deleting === booking.id ? '...' : 'Διαγραφή'}
    </button>
  </td>
</tr>
