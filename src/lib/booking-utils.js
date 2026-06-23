export const hours = [
  "09:30", "10:30", "11:30", "12:30", "13:30", "14:30",
  "15:30", "16:30", "17:30", "18:30", "19:30", "20:30", "21:30",
];

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
