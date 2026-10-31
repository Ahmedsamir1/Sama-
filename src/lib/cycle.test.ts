import { describe, expect, it } from 'vitest';
import { averageCycleLength, averagePeriodLength, cycleLengths, cycleStatus, DEFAULT_CYCLE, predictedPeriods, validatePeriod } from './cycle';
import { addDays, diffDays, isValidISO, monthGrid } from './dates';

const S = DEFAULT_CYCLE;
const P = (id: string, start: string, end?: string) => ({ id, start, end });

describe('dates', () => {
  it('adds and diffs days across month/year/DST boundaries', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(diffDays('2026-03-25', '2026-04-05')).toBe(11);
    expect(diffDays('2026-10-20', '2026-11-03')).toBe(14);
    expect(diffDays('2028-02-28', '2028-03-01')).toBe(2);
  });
  it('validates ISO dates', () => {
    expect(isValidISO('2026-02-29')).toBe(false);
    expect(isValidISO('2028-02-29')).toBe(true);
    expect(isValidISO('hello')).toBe(false);
  });
  it('builds month grids starting on the requested weekday', () => {
    // Oct 1 2026 is a Thursday.
    const sat = monthGrid(2026, 9, 6);
    expect(sat.indexOf('2026-10-01')).toBe(5);
    const sun = monthGrid(2026, 9, 0);
    expect(sun.indexOf('2026-10-01')).toBe(4);
    expect(sat.length % 7).toBe(0);
  });
});

describe('cycle calculations', () => {
  const periods = [P('a', '2026-07-01', '2026-07-05'), P('b', '2026-07-30', '2026-08-03'), P('c', '2026-08-29', '2026-09-02')];

  it('computes cycle lengths between consecutive starts, order-independent', () => {
    expect(cycleLengths([...periods].reverse())).toEqual([29, 30]);
  });

  it('ignores implausible gaps (e.g. a forgotten month)', () => {
    expect(cycleLengths([P('a', '2026-01-01'), P('b', '2026-03-05'), P('c', '2026-04-02')])).toEqual([28]);
  });

  it('uses recorded average when autoAverage, manual value otherwise', () => {
    expect(averageCycleLength(periods, S)).toBe(30); // round(29.5)
    expect(averageCycleLength(periods, { ...S, autoAverage: false, cycleLength: 33 })).toBe(33);
    expect(averageCycleLength([], { ...S, cycleLength: 31 })).toBe(31);
  });

  it('averages period length from completed records', () => {
    expect(averagePeriodLength(periods, S)).toBe(5);
    expect(averagePeriodLength([P('x', '2026-01-01')], { ...S, periodLength: 6 })).toBe(6);
  });

  it('reports cycle day and next estimate', () => {
    const st = cycleStatus(periods, S, '2026-09-10');
    expect(st.hasData).toBe(true);
    expect(st.cycleDay).toBe(13);
    expect(st.nextStart).toBe('2026-09-28');
    expect(st.daysUntilNext).toBe(18);
    expect(st.onPeriod).toBe(false);
  });

  it('flags ongoing period and late estimates', () => {
    expect(cycleStatus([P('a', '2026-09-01')], S, '2026-09-03').onPeriod).toBe(true);
    const late = cycleStatus([P('a', '2026-08-01', '2026-08-05')], S, '2026-09-02');
    expect(late.daysUntilNext).toBe(-4);
  });

  it('ignores future-dated records when computing the current cycle', () => {
    const st = cycleStatus([P('a', '2026-09-01', '2026-09-04'), P('b', '2026-12-01')], S, '2026-09-10');
    expect(st.lastStart).toBe('2026-09-01');
  });

  it('returns no status without data', () => {
    expect(cycleStatus([], S, '2026-09-10').hasData).toBe(false);
    expect(predictedPeriods([], S, '2026-09-10')).toEqual([]);
  });

  it('predicts upcoming windows and never in the past', () => {
    const pred = predictedPeriods(periods, S, '2026-09-10', 2);
    expect(pred[0]).toEqual({ start: '2026-09-28', end: '2026-10-02' });
    expect(pred[1].start).toBe('2026-10-28');
    const late = predictedPeriods([P('a', '2026-08-01', '2026-08-05')], S, '2026-09-02', 1);
    expect(late[0].start).toBe('2026-09-02');
  });

  it('validates records', () => {
    expect(validatePeriod(P('n', '2026-09-05', '2026-09-01'), periods)).toBe('errEndBeforeStart');
    expect(validatePeriod(P('n', '2026-09-01', '2026-09-30'), [])).toBe('errTooLong');
    expect(validatePeriod(P('n', '2026-08-31'), periods)).toBe('errOverlap');
    expect(validatePeriod(P('n', '2026-09-27'), periods)).toBeNull();
    expect(validatePeriod({ ...periods[2], end: '2026-09-04' }, periods)).toBeNull();
  });
});
