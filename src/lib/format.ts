// Money + date formatting. Always Intl with pl-PL. Never toLocaleString() plain.

const plnFormatter = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const plnFormatterNoCents = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 0,
});

export function formatPLN(value: number, opts?: { cents?: boolean }): string {
  if (opts?.cents === false) return plnFormatterNoCents.format(value);
  return plnFormatter.format(value);
}

const dateTimeFmt = new Intl.DateTimeFormat('pl-PL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dayMonthFmt = new Intl.DateTimeFormat('pl-PL', {
  day: '2-digit',
  month: '2-digit',
});

export function formatDate(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

export function formatDayMonth(iso: string): string {
  return dayMonthFmt.format(new Date(iso));
}

// Local date key YYYY-MM-DD — for aggregation, NOT display.
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
