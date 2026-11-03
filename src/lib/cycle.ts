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

/* ------------------------------------------------------------------ */
/* Fertility estimates & calendar classification                       */
/* ------------------------------------------------------------------ */

/** Luteal phase is roughly constant (~14 days), so ovulation ≈ next start − 14. */
export const LUTEAL_DAYS = 14;

export type DayKind = 'period' | 'predicted' | 'ovulation' | 'fertile' | 'safe';

export interface CycleWindow {
  start: ISODate;
  /** Last day of the cycle (day before the next start). */
  end: ISODate;
  periodEnd: ISODate;
  /** For a period still in progress: the estimated last day (days after periodEnd are shown as predicted). */
  expectedPeriodEnd: ISODate;
  ovulation: ISODate;
  fertileStart: ISODate;
  fertileEnd: ISODate;
  /** True for recorded cycles, false for predicted ones. */
  recorded: boolean;
}

/** Ovulation & fertile window for a cycle starting at `start` lasting `length` days. */
export function fertilityFor(start: ISODate, length: number, periodLength: number) {
  const ovOffset = Math.max(length - LUTEAL_DAYS, periodLength + 1);
  const ovulation = addDays(start, ovOffset);
  return { ovulation, fertileStart: addDays(ovulation, -5), fertileEnd: addDays(ovulation, 1) };
}

/**
 * Builds recorded + predicted cycle windows from saved data. Gaps longer than MAX_CYCLE
 * (e.g. months that were never logged) are not filled with guesses.
 */
export function cycleWindows(periods: PeriodRecord[], settings: CycleSettings, today: ISODate, until: ISODate): CycleWindow[] {
  const sorted = sortPeriods(periods);
  if (!sorted.length) return [];
  const avg = averageCycleLength(periods, settings);
  const plen = averagePeriodLength(periods, settings);
  const out: CycleWindow[] = [];
  const count = Math.min(36, Math.max(1, Math.ceil(diffDays(today, until) / avg) + 2));
  const preds = predictedPeriods(periods, settings, today, count);

  sorted.forEach((p, i) => {
    const next = sorted[i + 1];
    let end: ISODate;
    let length: number;
    if (next && diffDays(p.start, next.start) <= MAX_CYCLE) {
      length = diffDays(p.start, next.start);
      end = addDays(next.start, -1);
    } else if (!next && preds[0] && p.start <= today) {
      length = avg;
      end = addDays(preds[0].start, -1);
    } else {
      length = avg;
      end = addDays(p.start, avg - 1);
    }
    const pEnd = periodEnd(p, { ...settings, periodLength: plen }, today);
    const expectedPeriodEnd = p.end ? p.end : addDays(p.start, plen - 1);
    out.push({ start: p.start, end, periodEnd: pEnd, expectedPeriodEnd, recorded: true, ...fertilityFor(p.start, length, plen) });
  });

  // Future-dated records are ignored by predictions; only predict after the last current cycle.
  const lastRecorded = sorted.filter((p) => p.start <= today).at(-1)?.start ?? '';
  for (const r of preds) {
    if (r.start <= lastRecorded || out.some((w) => w.recorded && w.start === r.start)) continue;
    out.push({ start: r.start, end: addDays(r.start, avg - 1), periodEnd: r.end, expectedPeriodEnd: r.end, recorded: false, ...fertilityFor(r.start, avg, plen) });
  }
  return out;
}

/** Classifies each day in [from, to] for the calendar. Days outside any known cycle are omitted. */
export function classifyDays(
  periods: PeriodRecord[],
  settings: CycleSettings,
  today: ISODate,
  from: ISODate,
  to: ISODate,
): Map<ISODate, DayKind> {
  const map = new Map<ISODate, DayKind>();
  for (const w of cycleWindows(periods, settings, today, to)) {
    if (w.end < from || w.start > to) continue;
    for (let d = w.start < from ? from : w.start; d <= w.end && d <= to; d = addDays(d, 1)) {
      let kind: DayKind;
      if (d <= w.periodEnd) kind = w.recorded ? 'period' : 'predicted';
      else if (d <= w.expectedPeriodEnd) kind = 'predicted';
      else if (d === w.ovulation) kind = 'ovulation';
      else if (d >= w.fertileStart && d <= w.fertileEnd) kind = 'fertile';
      else kind = 'safe';
      // Recorded bleeding always wins over any estimate.
      const prev = map.get(d);
      if (prev === 'period') continue;
      map.set(d, kind);
    }
  }
  return map;
}

/** Large spread between recorded cycle lengths → estimates are less reliable. */
export function isIrregular(periods: PeriodRecord[]): boolean {
  const lens = cycleLengths(periods).slice(-6);
  if (lens.length < 3) return false;
  return Math.max(...lens) - Math.min(...lens) > 8;
}

export type CyclePhase =
  | { kind: 'none' }
  | { kind: 'period'; periodDay: number; endsIn: number; endDate: ISODate; recordedEnd: boolean }
  | { kind: 'beforeFertile'; daysUntil: number; date: ISODate }
  | { kind: 'fertile'; daysUntilOvulation: number; ovulation: ISODate }
  | { kind: 'luteal'; daysUntil: number; date: ISODate }
  | { kind: 'late'; daysLate: number; expected: ISODate };

/** What the summary card should say today. */
export function currentPhase(periods: PeriodRecord[], settings: CycleSettings, today: ISODate): CyclePhase {
  const status = cycleStatus(periods, settings, today);
  if (!status.hasData || !status.lastStart || !status.nextStart) return { kind: 'none' };
  const sorted = sortPeriods(periods).filter((p) => p.start <= today);
  const last = sorted[sorted.length - 1];
  const day = status.cycleDay!;

  if (status.onPeriod) {
    const endDate = last.end ?? addDays(last.start, status.periodLength - 1);
    return { kind: 'period', periodDay: day, endsIn: Math.max(0, diffDays(today, endDate)), endDate, recordedEnd: !!last.end };
  }
  if (status.daysUntilNext! < 0) return { kind: 'late', daysLate: -status.daysUntilNext!, expected: status.nextStart };
  // Too long since the last record to say anything meaningful about fertility.
  if (day > MAX_CYCLE) return { kind: 'late', daysLate: day - status.averageLength, expected: status.nextStart };

  const f = fertilityFor(last.start, status.averageLength, status.periodLength);
  if (today < f.fertileStart) return { kind: 'beforeFertile', daysUntil: diffDays(today, f.fertileStart), date: f.fertileStart };
  if (today <= f.fertileEnd) return { kind: 'fertile', daysUntilOvulation: diffDays(today, f.ovulation), ovulation: f.ovulation };
  return { kind: 'luteal', daysUntil: status.daysUntilNext!, date: status.nextStart };
}
