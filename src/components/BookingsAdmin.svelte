<script>
  let bookings = $state([]);
  let loading = $state(true);
  let error = $state('');
  let deleting = $state(null);
  let filter = $state('upcoming');
  let total = $state(0);
  let page = $state(0);
  const perPage = 50;

  // Counts per filter (fetched separately)
  let counts = $state({ all: 0, upcoming: 0, past: 0 });

  // Edit state
  let editing = $state(null);
  let editName = $state('');
  let editPhone = $state('');
  let editDate = $state('');
  let editHour = $state('');
  let saving = $state(false);
  let editError = $state('');
  let editErrors = $state({});

  // Create state
  let creating = $state(false);
  let createName = $state('');
  let createPhone = $state('');
  let createDate = $state('');
  let createHour = $state('');
  let createSaving = $state(false);
  let createError = $state('');
  let createErrors = $state({});

  const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  function validateFields(name, phone, date, hour) {
    const errors = {};
    if (!name.trim()) errors.name = 'Υποχρεωτικό πεδίο';
    if (!phone.trim()) errors.phone = 'Υποχρεωτικό πεδίο';
    else if (!/^\d{10}$/.test(phone.trim())) errors.phone = 'Απαιτούνται 10 ψηφία';
    if (!date) errors.date = 'Υποχρεωτικό πεδίο';
    if (!hour) errors.hour = 'Υποχρεωτικό πεδίο';
    return errors;
  }

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
    fetchBookings();
  }

  function goToPage(p) {
    page = p;
    fetchBookings();
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
      await fetchBookings();
      fetchCounts();
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
    editError = '';
    editErrors = {};
  }

  function cancelEdit() {
    editing = null;
  }

  async function saveEdit() {
    editErrors = validateFields(editName, editPhone, editDate, editHour);
    if (Object.keys(editErrors).length > 0) return;
    saving = true;
    editError = '';
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
      if (res.status === 409) {
        editError = 'Η ώρα αυτή είναι ήδη κρατημένη.';
        return;
      }
      if (!res.ok) throw new Error();
      await fetchBookings();
      fetchCounts();
      editing = null;
    } catch {
      editError = 'Αποτυχία ενημέρωσης.';
    } finally {
      saving = false;
    }
  }

  function startCreate() {
    creating = true;
    createName = '';
    createPhone = '';
    createDate = '';
    createHour = '';
    createError = '';
    createErrors = {};
  }

  function cancelCreate() {
    creating = false;
  }

  async function saveCreate() {
    createErrors = validateFields(createName, createPhone, createDate, createHour);
    if (Object.keys(createErrors).length > 0) return;
    createSaving = true;
    createError = '';
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          phone: createPhone.trim(),
          date: createDate,
          hour: createHour,
        }),
      });
      if (res.status === 409) {
        createError = 'Η ώρα αυτή είναι ήδη κρατημένη.';
        return;
      }
      if (!res.ok) throw new Error();
      creating = false;
      await fetchBookings();
      fetchCounts();
    } catch {
      createError = 'Αποτυχία δημιουργίας.';
    } finally {
      createSaving = false;
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

  $effect(() => {
    fetchBookings();
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
      <button
        onclick={startCreate}
        class="px-5 py-2.5 text-sm font-semibold border border-primary-600 text-primary-600 hover:bg-primary-700 hover:border-primary-700 hover:text-white rounded-sm transition-colors cursor-pointer"
      >
        + Νέα κράτηση
      </button>
    </div>
  {:else}
    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
      <button
        onclick={() => setFilter('all')}
        class="bg-white/60 backdrop-blur-sm border rounded-sm px-5 py-4 text-left cursor-pointer transition-all
          {filter === 'all' ? 'border-primary-400 ring-1 ring-primary-400' : 'border-stone-200 hover:border-stone-300'}"
      >
        <p class="text-sm text-neutral-500 uppercase tracking-wider font-semibold">Συνολο</p>
        <p class="text-3xl font-serif text-neutral-950 mt-1">{counts.all}</p>
      </button>
      <button
        onclick={() => setFilter('upcoming')}
        class="bg-white/60 backdrop-blur-sm border rounded-sm px-5 py-4 text-left cursor-pointer transition-all
          {filter === 'upcoming' ? 'border-accent-400 ring-1 ring-accent-400' : 'border-stone-200 hover:border-stone-300'}"
      >
        <p class="text-sm text-neutral-500 uppercase tracking-wider font-semibold">Επερχομενες</p>
        <p class="text-3xl font-serif text-primary-600 mt-1">{counts.upcoming}</p>
      </button>
      <button
        onclick={() => setFilter('past')}
        class="bg-white/60 backdrop-blur-sm border rounded-sm px-5 py-4 text-left cursor-pointer transition-all
          {filter === 'past' ? 'border-neutral-400 ring-1 ring-neutral-400' : 'border-stone-200 hover:border-stone-300'}"
      >
        <p class="text-sm text-neutral-500 uppercase tracking-wider font-semibold">Παρελθουσες</p>
        <p class="text-3xl font-serif text-neutral-400 mt-1">{counts.past}</p>
      </button>
    </div>

    <!-- Bookings List -->
    <div class="bg-white/60 backdrop-blur-sm border border-stone-200 rounded-sm overflow-hidden">
      <div class="px-6 py-4 bg-dark-900 flex justify-between items-center">
        <h2 class="font-serif text-xl text-white">Κρατήσεις</h2>
        <button
          onclick={startCreate}
          class="px-4 py-1.5 text-sm font-semibold border border-primary-400 text-primary-300 hover:bg-primary-600 hover:border-primary-600 hover:text-white rounded-sm transition-colors cursor-pointer"
        >
          + Νέα κράτηση
        </button>
      </div>

      {#if bookings.length === 0}
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
              {#each bookings as booking}
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
          {#each bookings as booking}
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

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="px-6 py-3 border-t border-stone-200 flex items-center justify-between">
          <p class="text-sm text-neutral-500">
            {page * perPage + 1}–{Math.min((page + 1) * perPage, total)} από {total}
          </p>
          <div class="flex gap-1">
            <button
              onclick={() => goToPage(page - 1)}
              disabled={page === 0}
              class="px-3 py-1.5 text-sm border border-stone-200 rounded-sm cursor-pointer transition-colors hover:bg-stone-50 disabled:opacity-30 disabled:cursor-default"
            >
              ←
            </button>
            {#each Array.from({ length: totalPages }, (_, i) => i) as p}
              {#if totalPages <= 7 || p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 1}
                <button
                  onclick={() => goToPage(p)}
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
              onclick={() => goToPage(page + 1)}
              disabled={page >= totalPages - 1}
              class="px-3 py-1.5 text-sm border border-stone-200 rounded-sm cursor-pointer transition-colors hover:bg-stone-50 disabled:opacity-30 disabled:cursor-default"
            >
              →
            </button>
          </div>
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
        {#if editError}
          <p class="text-sm text-red-600">{editError}</p>
        {/if}
        <div>
          <label for="edit-name" class="block text-sm text-neutral-600 mb-1.5">Ονοματεπώνυμο</label>
          <input
            id="edit-name"
            type="text"
            bind:value={editName}
            class="w-full px-4 py-3 text-sm bg-white border rounded-sm text-neutral-950 outline-none transition-colors
              {editErrors.name ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'border-stone-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400'}"
          />
          {#if editErrors.name}<p class="text-xs text-red-500 mt-1">{editErrors.name}</p>{/if}
        </div>
        <div>
          <label for="edit-phone" class="block text-sm text-neutral-600 mb-1.5">Τηλέφωνο</label>
          <input
            id="edit-phone"
            type="tel"
            bind:value={editPhone}
            class="w-full px-4 py-3 text-sm bg-white border rounded-sm text-neutral-950 outline-none transition-colors
              {editErrors.phone ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'border-stone-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400'}"
          />
          {#if editErrors.phone}<p class="text-xs text-red-500 mt-1">{editErrors.phone}</p>{/if}
        </div>
        <div>
          <label for="edit-date" class="block text-sm text-neutral-600 mb-1.5">Ημερομηνία</label>
          <input
            id="edit-date"
            type="date"
            bind:value={editDate}
            class="w-full px-4 py-3 text-sm bg-white border rounded-sm text-neutral-950 outline-none transition-colors
              {editErrors.date ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'border-stone-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400'}"
          />
          {#if editErrors.date}<p class="text-xs text-red-500 mt-1">{editErrors.date}</p>{/if}
        </div>
        <div>
          <label for="edit-hour" class="block text-sm text-neutral-600 mb-1.5">Ώρα</label>
          <select
            id="edit-hour"
            bind:value={editHour}
            class="w-full px-4 py-3 text-sm bg-white border rounded-sm text-neutral-950 outline-none transition-colors
              {editErrors.hour ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'border-stone-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400'}"
          >
            {#each hours as h}
              <option value={h}>{h}</option>
            {/each}
          </select>
          {#if editErrors.hour}<p class="text-xs text-red-500 mt-1">{editErrors.hour}</p>{/if}
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

<!-- Create Modal -->
{#if creating}
  <div class="fixed inset-0 z-50 flex items-center justify-center px-4">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick={cancelCreate}></div>
    <div class="relative bg-white border border-stone-200 rounded-sm w-full max-w-md shadow-xl">
      <div class="px-6 py-4 bg-dark-900">
        <h3 class="font-serif text-lg text-white">Νέα κράτηση</h3>
      </div>
      <div class="px-6 py-5 space-y-4">
        {#if createError}
          <p class="text-sm text-red-600">{createError}</p>
        {/if}
        <div>
          <label for="create-name" class="block text-sm text-neutral-600 mb-1.5">Ονοματεπώνυμο</label>
          <input
            id="create-name"
            type="text"
            bind:value={createName}
            class="w-full px-4 py-3 text-sm bg-white border rounded-sm text-neutral-950 outline-none transition-colors
              {createErrors.name ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'border-stone-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400'}"
          />
          {#if createErrors.name}<p class="text-xs text-red-500 mt-1">{createErrors.name}</p>{/if}
        </div>
        <div>
          <label for="create-phone" class="block text-sm text-neutral-600 mb-1.5">Τηλέφωνο</label>
          <input
            id="create-phone"
            type="tel"
            bind:value={createPhone}
            class="w-full px-4 py-3 text-sm bg-white border rounded-sm text-neutral-950 outline-none transition-colors
              {createErrors.phone ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'border-stone-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400'}"
          />
          {#if createErrors.phone}<p class="text-xs text-red-500 mt-1">{createErrors.phone}</p>{/if}
        </div>
        <div>
          <label for="create-date" class="block text-sm text-neutral-600 mb-1.5">Ημερομηνία</label>
          <input
            id="create-date"
            type="date"
            bind:value={createDate}
            class="w-full px-4 py-3 text-sm bg-white border rounded-sm text-neutral-950 outline-none transition-colors
              {createErrors.date ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'border-stone-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400'}"
          />
          {#if createErrors.date}<p class="text-xs text-red-500 mt-1">{createErrors.date}</p>{/if}
        </div>
        <div>
          <label for="create-hour" class="block text-sm text-neutral-600 mb-1.5">Ώρα</label>
          <select
            id="create-hour"
            bind:value={createHour}
            class="w-full px-4 py-3 text-sm bg-white border rounded-sm text-neutral-950 outline-none transition-colors
              {createErrors.hour ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400' : 'border-stone-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400'}"
          >
            <option value="" disabled>Επιλέξτε ώρα</option>
            {#each hours as h}
              <option value={h}>{h}</option>
            {/each}
          </select>
          {#if createErrors.hour}<p class="text-xs text-red-500 mt-1">{createErrors.hour}</p>{/if}
        </div>
      </div>
      <div class="px-6 py-4 border-t border-stone-200 flex gap-3 justify-end">
        <button
          onclick={cancelCreate}
          class="px-5 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
        >
          Ακύρωση
        </button>
        <button
          onclick={saveCreate}
          disabled={createSaving}
          class="px-5 py-2.5 text-sm font-semibold border border-primary-600 text-primary-600 hover:bg-primary-700 hover:border-primary-700 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
        >
          {createSaving ? 'Αποθήκευση...' : 'Δημιουργία'}
        </button>
      </div>
    </div>
  </div>
{/if}
