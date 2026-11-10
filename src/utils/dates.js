/** Calendar-date helpers that never mix UTC ISO strings with local midnight. */

export function toDateKey(value) {
  if (!value) return '';
  const raw = String(value);
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return formatLocalDate(d);
}

export function formatLocalDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(value) {
  const key = toDateKey(value);
  if (!key) return null;
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey() {
  return formatLocalDate(new Date());
}

export function addDays(value, days) {
  const d = parseLocalDate(value);
  if (!d) return '';
  d.setDate(d.getDate() + Number(days || 0));
  return formatLocalDate(d);
}
