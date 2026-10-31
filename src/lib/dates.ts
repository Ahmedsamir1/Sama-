/** Date helpers working on local calendar days encoded as "YYYY-MM-DD". */
export type ISODate = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISO(now);
}

export function isValidISO(s: unknown): s is ISODate {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return toISO(fromISO(s)) === s;
}

export function addDays(s: ISODate, days: number): ISODate {
  const d = fromISO(s);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** Whole calendar days from a to b (b - a). DST-safe. */
export function diffDays(a: ISODate, b: ISODate): number {
  const utc = (s: ISODate) => {
    const [y, m, d] = s.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

export function isBetween(day: ISODate, start: ISODate, end: ISODate): boolean {
  return day >= start && day <= end;
}

/** Calendar grid for a month: weeks starting on Saturday (Egypt) or Sunday. */
export function monthGrid(year: number, month: number, weekStartsOn: number): (ISODate | null)[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const cells: (ISODate | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toISO(new Date(year, month, d)));
  while (cells.length % 7) cells.push(null);
  return cells;
}
