export const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('el-GR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function isPast(dateStr, hour) {
  const [h, m] = hour.split(':').map(Number);
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(h, m);
  return d < new Date();
}

export function validateFields(name, phone, date, hour) {
  const errors = {};
  if (!name.trim()) errors.name = 'Υποχρεωτικό πεδίο';
  if (!phone.trim()) errors.phone = 'Υποχρεωτικό πεδίο';
  else if (!/^\d{10}$/.test(phone.trim())) errors.phone = 'Απαιτούνται 10 ψηφία';
  if (!date) errors.date = 'Υποχρεωτικό πεδίο';
  if (!hour) errors.hour = 'Υποχρεωτικό πεδίο';
  return errors;
}
