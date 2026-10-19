/** 1250 -> "$12.50", 600 -> "$6" */
export function money(cents: number): string {
  const dollars = cents / 100;
  return '$' + (cents % 100 === 0 ? dollars.toFixed(0) : dollars.toFixed(2));
}

/** "12.50" typed by a user -> 1250. Returns null if it isn't a valid amount. */
export function toCents(text: string): number | null {
  if (text.trim() === '') return null;
  const value = Number(text.replace('$', '').trim());
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

/** Date -> "2026-10-03", using the phone's local calendar day. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** "2026-10-03" -> "Oct 3" */
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function firstName(fullName: string | null | undefined): string {
  return fullName?.trim().split(' ')[0] || 'A student';
}

/** "Other · Costume" for Other listings with a detail, otherwise just the category. */
export function categoryLabel(category: string | null, detail: string | null): string | null {
  if (category === 'Other' && detail) return `Other · ${detail}`;
  return category;
}
