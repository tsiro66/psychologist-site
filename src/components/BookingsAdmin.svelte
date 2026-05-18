<script>
  let bookings = $state([]);
  let loading = $state(true);
  let error = $state('');
  let deleting = $state(null);
  let filter = $state('all'); // 'all' | 'upcoming' | 'past'

  // Edit state
  let editing = $state(null);
  let editName = $state('');
  let editPhone = $state('');
  let editDate = $state('');
  let editHour = $state('');
  let saving = $state(false);

  const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  async function fetchBookings() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/api/booking');
      if (!res.ok) throw new Error();
      bookings = await res.json();
    } catch {
      error = 'Αποτυχία φόρτωσης κρατήσεων.';
    } finally {
      loading = false;
    }
  }

  async function deleteBooking(id) {
    if (!confirm('Σίγουρα θέλεις να διαγράψεις αυτή την κράτηση;')) return;
    deleting = id;
    try {
      const res = await fetch('/api/booking', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      bookings = bookings.filter(b => b.id !== id);
    } catch {
      error = 'Αποτυχία διαγραφής.';
    } finally {
      deleting = null;
    }
  }

  function startEdit(booking) {
    editing = booking.id;
    editName = booking.name;
    editPhone = booking.phone;
    editDate = booking.date;
    editHour = booking.hour;
  }

  function cancelEdit() {
    editing = null;
  }

  async function saveEdit() {
    if (!editName.trim() || !editPhone.trim() || !editDate || !editHour) return;
    saving = true;
    try {
      const res = await fetch('/api/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing,
          name: editName.trim(),
          phone: editPhone.trim(),
          date: editDate,
          hour: editHour,
        }),
      });
      if (!res.ok) throw new Error();
      bookings = bookings.map(b =>
        b.id === editing
          ? { ...b, name: editName.trim(), phone: editPhone.trim(), date: editDate, hour: editHour }
          : b
      );
      editing = null;
    } catch {
      error = 'Αποτυχία ενημέρωσης.';
    } finally {
      saving = false;
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('el-GR', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function isPast(dateStr, hour) {
    const [h, m] = hour.split(':').map(Number);
    const d = new Date(dateStr + 'T00:00:00');
    d.setHours(h, m);
    return d < new Date();
  }

  let upcomingCount = $derived(bookings.filter(b => !isPast(b.date, b.hour)).length);
  let pastCount = $derived(bookings.filter(b => isPast(b.date, b.hour)).length);

  let filtered = $derived(
    filter === 'upcoming' ? bookings.filter(b => !isPast(b.date, b.hour))
    : filter === 'past' ? bookings.filter(b => isPast(b.date, b.hour))
    : bookings
  );

  $effect(() => {
    fetchBookings();
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
  {:else if bookings.length === 0}
    <div class="text-center py-16">
      <p class="text-neutral-400 text-lg">Δεν υπάρχουν κρατήσεις.</p>
    </div>
  {:else}
    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
      <button
        onclick={() => filter = filter === 'all' ? 'all' : 'all'}
        class="bg-white/60 backdrop-blur-sm border rounded-sm px-5 py-4 text-left cursor-pointer transition-all
          {filter === 'all' ? 'border-primary-400 ring-1 ring-primary-400' : 'border-stone-200 hover:border-stone-300'}"
      >
        <p class="text-sm text-neutral-500 uppercase tracking-wider font-semibold">Συνολο</p>
        <p class="text-3xl font-serif text-neutral-950 mt-1">{bookings.length}</p>
      </button>
      <button
        onclick={() => filter = filter === 'upcoming' ? 'all' : 'upcoming'}
        class="bg-white/60 backdrop-blur-sm border rounded-sm px-5 py-4 text-left cursor-pointer transition-all
          {filter === 'upcoming' ? 'border-accent-400 ring-1 ring-accent-400' : 'border-stone-200 hover:border-stone-300'}"
      >
        <p class="text-sm text-neutral-500 uppercase tracking-wider font-semibold">Επερχομενες</p>
        <p class="text-3xl font-serif text-primary-600 mt-1">{upcomingCount}</p>
      </button>
      <button
        onclick={() => filter = filter === 'past' ? 'all' : 'past'}
        class="bg-white/60 backdrop-blur-sm border rounded-sm px-5 py-4 text-left cursor-pointer transition-all
          {filter === 'past' ? 'border-neutral-400 ring-1 ring-neutral-400' : 'border-stone-200 hover:border-stone-300'}"
      >
        <p class="text-sm text-neutral-500 uppercase tracking-wider font-semibold">Παρελθουσες</p>
        <p class="text-3xl font-serif text-neutral-400 mt-1">{pastCount}</p>
      </button>
    </div>

    <!-- Bookings List -->
    <div class="bg-white/60 backdrop-blur-sm border border-stone-200 rounded-sm overflow-hidden">
      <div class="px-6 py-4 bg-dark-900 flex justify-between items-center">
        <h2 class="font-serif text-xl text-white">Κρατήσεις</h2>
        {#if filter !== 'all'}
          <button onclick={() => filter = 'all'} class="text-sm text-primary-300 hover:text-accent-300 transition-colors cursor-pointer">
            Εμφάνιση όλων
          </button>
        {/if}
      </div>

      {#if filtered.length === 0}
        <div class="text-center py-12 text-neutral-400">Δεν βρέθηκαν κρατήσεις.</div>
      {:else}
        <!-- Desktop table -->
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
              {#each filtered as booking}
                <tr class="border-b border-stone-100 last:border-0 {isPast(booking.date, booking.hour) ? 'opacity-50' : ''}">
                  <td class="px-6 py-4 text-sm text-neutral-950 capitalize">{formatDate(booking.date)}</td>
                  <td class="px-6 py-4 text-sm text-neutral-950 font-medium">{booking.hour}</td>
                  <td class="px-6 py-4 text-sm text-neutral-950">{booking.name}</td>
                  <td class="px-6 py-4 text-sm text-neutral-600">{booking.phone}</td>
                  <td class="px-6 py-4 text-right space-x-3">
                    <button
                      onclick={() => startEdit(booking)}
                      class="text-sm text-primary-500 hover:text-primary-700 transition-colors cursor-pointer"
                    >
                      Επεξεργασία
                    </button>
                    <button
                      onclick={() => deleteBooking(booking.id)}
                      disabled={deleting === booking.id}
                      class="text-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {deleting === booking.id ? '...' : 'Διαγραφή'}
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <div class="sm:hidden divide-y divide-stone-100">
          {#each filtered as booking}
            <div class="px-5 py-4 {isPast(booking.date, booking.hour) ? 'opacity-50' : ''}">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <p class="text-sm font-medium text-neutral-950">{booking.name}</p>
                  <p class="text-sm text-neutral-500">{booking.phone}</p>
                </div>
                <div class="flex gap-3">
                  <button
                    onclick={() => startEdit(booking)}
                    class="text-sm text-primary-500 hover:text-primary-700 transition-colors cursor-pointer"
                  >
                    Επεξ.
                  </button>
                  <button
                    onclick={() => deleteBooking(booking.id)}
                    disabled={deleting === booking.id}
                    class="text-sm text-red-500 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {deleting === booking.id ? '...' : 'Διαγραφή'}
                  </button>
                </div>
              </div>
              <p class="text-sm text-neutral-700 capitalize">{formatDate(booking.date)} · <span class="font-medium">{booking.hour}</span></p>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Edit Modal -->
{#if editing}
  <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick={cancelEdit}></div>
    <div class="relative bg-white border border-stone-200 rounded-sm w-full max-w-md shadow-xl">
      <div class="px-6 py-4 bg-dark-900">
        <h3 class="font-serif text-lg text-white">Επεξεργασία κράτησης</h3>
      </div>
      <div class="px-6 py-5 space-y-4">
        <div>
          <label for="edit-name" class="block text-sm text-neutral-600 mb-1.5">Ονοματεπώνυμο</label>
          <input
            id="edit-name"
            type="text"
            bind:value={editName}
            class="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-sm text-neutral-950 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-colors"
          />
        </div>
        <div>
          <label for="edit-phone" class="block text-sm text-neutral-600 mb-1.5">Τηλέφωνο</label>
          <input
            id="edit-phone"
            type="tel"
            bind:value={editPhone}
            class="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-sm text-neutral-950 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-colors"
          />
        </div>
        <div>
          <label for="edit-date" class="block text-sm text-neutral-600 mb-1.5">Ημερομηνία</label>
          <input
            id="edit-date"
            type="date"
            bind:value={editDate}
            class="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-sm text-neutral-950 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-colors"
          />
        </div>
        <div>
          <label for="edit-hour" class="block text-sm text-neutral-600 mb-1.5">Ώρα</label>
          <select
            id="edit-hour"
            bind:value={editHour}
            class="w-full px-4 py-3 text-sm bg-white border border-stone-200 rounded-sm text-neutral-950 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-colors"
          >
            {#each hours as h}
              <option value={h}>{h}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="px-6 py-4 border-t border-stone-200 flex gap-3 justify-end">
        <button
          onclick={cancelEdit}
          class="px-5 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
        >
          Ακύρωση
        </button>
        <button
          onclick={saveEdit}
          disabled={saving}
          class="px-5 py-2.5 text-sm font-semibold border border-primary-600 text-primary-600 hover:bg-primary-700 hover:border-primary-700 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
        >
          {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
        </button>
      </div>
    </div>
  </div>
{/if}
