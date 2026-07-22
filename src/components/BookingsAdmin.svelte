<script>
  import { onMount } from 'svelte';
  import FilterStats from './FilterStats.svelte';
  import BookingRow from './BookingRow.svelte';
  import BookingCard from './BookingCard.svelte';
  import Pagination from './Pagination.svelte';
  import BookingModal from './BookingModal.svelte';
  import ConfirmModal from './ConfirmModal.svelte';
  import BulkBlockModal from './BulkBlockModal.svelte';
  import { formatDate } from '../lib/booking-utils.js';

  let bookings = $state([]);
  let loading = $state(true);
  let error = $state('');
  let deleting = $state(null);
  let filter = $state('upcoming');
  let total = $state(0);
  let page = $state(0);
  const perPage = 50;

  let counts = $state({ all: 0, upcoming: 0, past: 0 });

  let modalMode = $state(null);
  let modalBooking = $state(null);
  let modalSaving = $state(false);
  let modalError = $state('');
  let confirmDeleteId = $state(null);

  let showBulkBlock = $state(false);
  let bulkSaving = $state(false);
  let bulkError = $state('');

  let totalPages = $derived(Math.max(1, Math.ceil(total / perPage)));

  async function fetchBookings() {
    loading = true;
    error = '';
    try {
      const params = new URLSearchParams({
        filter,
        limit: String(perPage),
        offset: String(page * perPage),
      });
      const res = await fetch(`/api/booking?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      bookings = json.data;
      total = json.total;
      counts[filter] = json.total;
    } catch {
      error = 'Αποτυχία φόρτωσης κρατήσεων.';
    } finally {
      loading = false;
    }
  }

  async function fetchCounts() {
    const filters = ['all', 'upcoming', 'past'];
    const results = await Promise.all(
      filters.map(f =>
        fetch(`/api/booking?filter=${f}&limit=1`).then(r => r.json()).catch(() => ({ total: 0 }))
      )
    );
    counts = { all: results[0].total, upcoming: results[1].total, past: results[2].total };
  }

  function setFilter(f) {
    if (filter === f) return;
    filter = f;
    page = 0;
  }

  function goToPage(p) {
    page = p;
  }

  function requestDelete(id) {
    confirmDeleteId = id;
  }

  function cancelDelete() {
    confirmDeleteId = null;
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    deleting = confirmDeleteId;
    confirmDeleteId = null;
    try {
      const res = await fetch('/api/booking', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleting }),
      });
      if (!res.ok) throw new Error();
      await fetchBookings();
      fetchCounts();
    } catch {
      error = 'Αποτυχία διαγραφής.';
    } finally {
      deleting = null;
    }
  }

  function startEdit(booking) {
    modalMode = 'edit';
    modalBooking = booking;
    modalError = '';
  }

  function startCreate() {
    modalMode = 'create';
    modalBooking = null;
    modalError = '';
  }

  function closeModal() {
    modalMode = null;
    modalBooking = null;
  }

  async function handleSave(values) {
    modalSaving = true;
    modalError = '';
    try {
      const body = modalMode === 'edit'
        ? { id: modalBooking.id, ...values }
        : values;
      const method = modalMode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch('/api/booking', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        modalError = 'Η ώρα αυτή είναι ήδη κρατημένη.';
        return;
      }
      if (!res.ok) throw new Error();
      closeModal();
      await fetchBookings();
      fetchCounts();
    } catch {
      modalError = modalMode === 'edit' ? 'Αποτυχία ενημέρωσης.' : 'Αποτυχία δημιουργίας.';
    } finally {
      modalSaving = false;
    }
  }

  function openBulkBlock() {
    showBulkBlock = true;
    bulkError = '';
  }

  function closeBulkBlock() {
    showBulkBlock = false;
  }

  async function handleBulkBlock(payload) {
    bulkSaving = true;
    bulkError = '';
    try {
      const res = await fetch('/api/booking/bulk-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        bulkError = data.error || 'Αποτυχία κράτησης.';
        return;
      }
      showBulkBlock = false;
    } catch {
      bulkError = 'Αποτυχία κράτησης.';
    } finally {
      bulkSaving = false;
    }
  }

  $effect(() => {
    fetchBookings();
  });

  onMount(() => {
    fetchCounts();
  });
</script>

<div class="w-full max-w-4xl mx-auto">
  {#if loading}
    <div class="text-center py-16 text-neutral-400">Φόρτωση...</div>
  {:else if error}
    <div class="text-center py-16">
      <p class="text-red-600 mb-4">{error}</p>
      <button onclick={fetchBookings} class="text-sm font-semibold text-primary-700 hover:text-primary-800 cursor-pointer">
        Δοκίμασε ξανά
      </button>
    </div>
  {:else if counts.all === 0}
    <div class="text-center py-16">
      <p class="text-neutral-400 text-lg mb-6">Δεν υπάρχουν κρατήσεις.</p>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <button
          onclick={openBulkBlock}
          class="px-5 py-2.5 text-sm font-semibold border border-primary-600 text-primary-600 hover:bg-primary-700 hover:border-primary-700 hover:text-white rounded-sm transition-colors cursor-pointer"
        >
          Μαζικές κρατήσεις
        </button>
        <button
          onclick={startCreate}
          class="px-5 py-2.5 text-sm font-semibold border border-primary-600 text-primary-600 hover:bg-primary-700 hover:border-primary-700 hover:text-white rounded-sm transition-colors cursor-pointer"
        >
          + Νέα κράτηση
        </button>
      </div>
    </div>
  {:else}
    <FilterStats {counts} {filter} onFilterChange={setFilter} />

    <div class="bg-white/60 backdrop-blur-sm border border-stone-200 rounded-sm overflow-hidden">
      <div class="px-6 py-4 bg-dark-900 flex justify-between items-center gap-2">
        <h2 class="font-serif text-xl text-white">Κρατήσεις</h2>
        <div class="flex gap-2">
          <button
            onclick={openBulkBlock}
            class="px-4 py-1.5 text-sm font-semibold border border-primary-400 text-primary-300 hover:bg-primary-600 hover:border-primary-600 hover:text-white rounded-sm transition-colors cursor-pointer"
          >
            Μαζικές κρατήσεις
          </button>
          <button
            onclick={startCreate}
            class="px-4 py-1.5 text-sm font-semibold border border-primary-400 text-primary-300 hover:bg-primary-600 hover:border-primary-600 hover:text-white rounded-sm transition-colors cursor-pointer"
          >
            + Νέα κράτηση
          </button>
        </div>
      </div>

      {#if bookings.length === 0}
        <div class="text-center py-12 text-neutral-400">Δεν βρέθηκαν κρατήσεις.</div>
      {:else}
        <div class="hidden sm:block">
          <table class="w-full">
            <thead>
              <tr class="border-b border-stone-200">
                <th class="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-6 py-3">Ημερομηνία</th>
                <th class="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-6 py-3">Ώρα</th>
                <th class="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-6 py-3">Όνομα</th>
                <th class="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider px-6 py-3">Τηλέφωνο</th>
                <th class="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {#each bookings as booking}
                <BookingRow {booking} {deleting} onEdit={startEdit} onDelete={requestDelete} />
              {/each}
            </tbody>
          </table>
        </div>

        <div class="sm:hidden divide-y divide-stone-100">
          {#each bookings as booking}
            <BookingCard {booking} {deleting} onEdit={startEdit} onDelete={requestDelete} />
          {/each}
        </div>
      {/if}

      <Pagination {page} {totalPages} {total} {perPage} onPageChange={goToPage} />
    </div>
  {/if}
</div>

{#if modalMode}
  {#key modalMode === 'edit' ? (modalBooking?.id ?? 'new') : 'new'}
  <BookingModal
    title={modalMode === 'edit' ? 'Επεξεργασία κράτησης' : 'Νέα κράτηση'}
    initialValues={modalBooking ? { name: modalBooking.name, phone: modalBooking.phone, date: modalBooking.date, hour: modalBooking.hour } : {}}
    saving={modalSaving}
    externalError={modalError}
    submitLabel={modalMode === 'edit' ? 'Αποθήκευση' : 'Δημιουργία'}
    onSave={handleSave}
    onCancel={closeModal}
  />
  {/key}
{/if}

{#if confirmDeleteId}
  {@const b = bookings.find(x => x.id === confirmDeleteId)}
  {#if b}
    <ConfirmModal
      title="Διαγραφή κράτησης"
      message="{b.name} — {formatDate(b.date)}, {b.hour}"
      loading={deleting === confirmDeleteId}
      onConfirm={confirmDelete}
      onCancel={cancelDelete}
    />
  {/if}
{/if}

{#if showBulkBlock}
  <BulkBlockModal
    saving={bulkSaving}
    externalError={bulkError}
    onSave={handleBulkBlock}
    onCancel={closeBulkBlock}
  />
{/if}
