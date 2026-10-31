import { addDays, diffDays, type ISODate } from './dates';

export interface PeriodRecord {
  id: string;
  start: ISODate;
  end?: ISODate;
}

export interface CycleSettings {
  /** Manually set average cycle length in days. */
  cycleLength: number;
  /** Typical number of bleeding days. */
  periodLength: number;
  /** When true, the average is computed from recorded cycles (if any). */
  autoAverage: boolean;
}

export const MIN_CYCLE = 15;
export const MAX_CYCLE = 60;
export const DEFAULT_CYCLE: CycleSettings = { cycleLength: 28, periodLength: 5, autoAverage: true };

export function sortPeriods(periods: PeriodRecord[]): PeriodRecord[] {
  return [...periods].sort((a, b) => a.start.localeCompare(b.start));
}

/** Lengths between consecutive period starts, ignoring implausible gaps (e.g. a forgotten month). */
export function cycleLengths(periods: PeriodRecord[]): number[] {
  const sorted = sortPeriods(periods);
  const out: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const len = diffDays(sorted[i - 1].start, sorted[i].start);
    if (len >= MIN_CYCLE && len <= MAX_CYCLE) out.push(len);
  }
  return out;
}

export function averageCycleLength(periods: PeriodRecord[], settings: CycleSettings, window = 6): number {
  const lengths = cycleLengths(periods).slice(-window);
  if (!settings.autoAverage || lengths.length === 0) return settings.cycleLength;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

export function averagePeriodLength(periods: PeriodRecord[], settings: CycleSettings): number {
  const lens = periods.filter((p) => p.end).map((p) => diffDays(p.start, p.end!) + 1).filter((n) => n >= 1 && n <= 14);
  if (!settings.autoAverage || lens.length === 0) return settings.periodLength;
  return Math.round(lens.reduce((a, b) => a + b, 0) / lens.length);
}

export interface CycleStatus {
  hasData: boolean;
  lastStart?: ISODate;
  /** 1-based day of the current cycle. */
  cycleDay?: number;
  averageLength: number;
  periodLength: number;
  /** Estimated start of next period (an estimate only!). */
  nextStart?: ISODate;
  /** Days until nextStart; negative if the estimate has passed. */
  daysUntilNext?: number;
  /** True if a period is currently being recorded (started, not ended, within plausible length). */
  onPeriod: boolean;
}

export function cycleStatus(periods: PeriodRecord[], settings: CycleSettings, today: ISODate): CycleStatus {
  const averageLength = averageCycleLength(periods, settings);
  const periodLength = averagePeriodLength(periods, settings);
  const past = sortPeriods(periods).filter((p) => p.start <= today);
  const last = past[past.length - 1];
  if (!last) return { hasData: false, averageLength, periodLength, onPeriod: false };
  const cycleDay = diffDays(last.start, today) + 1;
  const nextStart = addDays(last.start, averageLength);
  const onPeriod = last.end ? today <= last.end : cycleDay <= Math.max(periodLength, 1) + 3;
  return {
    hasData: true,
    lastStart: last.start,
    cycleDay,
    averageLength,
    periodLength,
    nextStart,
    daysUntilNext: diffDays(today, nextStart),
    onPeriod,
  };
}

/** Estimated future period windows (start..end) for the calendar. */
export function predictedPeriods(
  periods: PeriodRecord[],
  settings: CycleSettings,
  today: ISODate,
  count = 3,
): { start: ISODate; end: ISODate }[] {
  const status = cycleStatus(periods, settings, today);
  if (!status.nextStart) return [];
  const out: { start: ISODate; end: ISODate }[] = [];
  let start = status.nextStart;
  // If the estimate already passed without a new record, keep showing it from today onward.
  if (start < today) start = today;
  for (let i = 0; i < count; i++) {
    out.push({ start, end: addDays(start, status.periodLength - 1) });
    start = addDays(start, status.averageLength);
  }
  return out;
}

export function periodEnd(p: PeriodRecord, settings: CycleSettings, today: ISODate): ISODate {
  if (p.end) return p.end;
  const assumed = addDays(p.start, settings.periodLength - 1);
  return assumed < today ? assumed : today;
}

/** Returns an error key if adding/editing this record would be invalid, otherwise null. */
export function validatePeriod(record: PeriodRecord, others: PeriodRecord[]): string | null {
  if (record.end && record.end < record.start) return 'errEndBeforeStart';
  if (record.end && diffDays(record.start, record.end) > 15) return 'errTooLong';
  for (const o of others) {
    if (o.id === record.id) continue;
    const oEnd = o.end ?? addDays(o.start, 7);
    const rEnd = record.end ?? addDays(record.start, 7);
    if (record.start <= oEnd && o.start <= rEnd) return 'errOverlap';
  }
  return null;
}
