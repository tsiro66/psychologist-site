<script>
  import { hours, validateFields } from '../lib/booking-utils.js';
  import { trapFocus } from '../lib/modal.js';

  let {
    title,
    initialValues = { name: '', phone: '', date: '', hour: '' },
    saving = false,
    externalError = '',
    submitLabel = 'Αποθήκευση',
    onSave,
    onCancel,
  } = $props();

  let name = $state(initialValues.name ?? '');
  let phone = $state(initialValues.phone ?? '');
  let date = $state(initialValues.date ?? '');
  let hour = $state(initialValues.hour ?? '');
  let errors = $state({});

  function handleSubmit() {
    errors = validateFields(name, phone, date, hour);
    if (Object.keys(errors).length > 0) return;
    onSave({ name: name.trim(), phone: phone.trim(), date, hour });
  }

  function fieldClass(field) {
    return `w-full px-4 py-3 text-sm bg-white border rounded-sm text-neutral-950 outline-none transition-colors ${
      errors[field]
        ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-400'
        : 'border-stone-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400'
    }`;
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center px-4">
  <button type="button" class="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default" aria-label="Κλείσιμο" onclick={onCancel}></button>
  <div
    class="relative bg-white rounded-sm w-full max-w-md shadow-xl"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    use:trapFocus
    oncancel={onCancel}
  >
    <div class="px-6 py-4 bg-dark-900">
      <h3 id="modal-title" class="font-serif text-lg text-white">{title}</h3>
    </div>
    <div class="px-6 py-5 space-y-4">
      {#if externalError}
        <p class="text-sm text-red-600">{externalError}</p>
      {/if}
      <div>
        <label for="modal-name" class="block text-sm text-neutral-600 mb-1.5">Ονοματεπώνυμο</label>
        <input id="modal-name" type="text" bind:value={name} class={fieldClass('name')} />
        {#if errors.name}<p class="text-xs text-red-500 mt-1">{errors.name}</p>{/if}
      </div>
      <div>
        <label for="modal-phone" class="block text-sm text-neutral-600 mb-1.5">Τηλέφωνο</label>
        <input id="modal-phone" type="tel" inputmode="tel" bind:value={phone} class={fieldClass('phone')} />
        {#if errors.phone}<p class="text-xs text-red-500 mt-1">{errors.phone}</p>{/if}
      </div>
      <div>
        <label for="modal-date" class="block text-sm text-neutral-600 mb-1.5">Ημερομηνία</label>
        <input id="modal-date" type="date" bind:value={date} class={fieldClass('date')} />
        {#if errors.date}<p class="text-xs text-red-500 mt-1">{errors.date}</p>{/if}
      </div>
      <div>
        <label for="modal-hour" class="block text-sm text-neutral-600 mb-1.5">Ώρα</label>
        <select id="modal-hour" bind:value={hour} class={fieldClass('hour')}>
          {#if !initialValues.hour}
            <option value="" disabled>Επιλέξτε ώρα</option>
          {/if}
          {#each hours as h}
            <option value={h}>{h}</option>
          {/each}
        </select>
        {#if errors.hour}<p class="text-xs text-red-500 mt-1">{errors.hour}</p>{/if}
      </div>
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
        disabled={saving}
        class="px-5 py-2.5 text-sm font-semibold border border-primary-600 text-primary-600 hover:bg-primary-700 hover:border-primary-700 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
      >
        {saving ? 'Αποθήκευση...' : submitLabel}
      </button>
    </div>
  </div>
</div>
