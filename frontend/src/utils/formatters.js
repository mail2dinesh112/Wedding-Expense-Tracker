const whole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const fraction = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const shortDate = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

const longDate = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

const monthOnly = new Intl.DateTimeFormat('en-IN', { month: 'short' });

export function isValidISO(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function toDate(value) {
  if (!isValidISO(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatINR(amount) {
  const value = Number(amount) || 0;
  const hasFraction = Math.abs(value * 100 % 1) > 0 || Math.abs(value % 1) > 0;
  return (hasFraction ? fraction : whole).format(value);
}

export function formatDate(value) {
  const date = toDate(value);
  return date ? shortDate.format(date) : value || '';
}

export function formatLongDate(value) {
  const date = toDate(value);
  return date ? longDate.format(date) : value || '';
}

export function formatMonth(value) {
  const date = toDate(value);
  return date ? monthOnly.format(date) : '';
}

export function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
