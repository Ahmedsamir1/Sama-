import { describe, expect, it } from 'vitest';
import { classifyDays, currentPhase, cycleWindows, DEFAULT_CYCLE, fertilityFor, isIrregular } from './cycle';

const S = DEFAULT_CYCLE;
const P = (id: string, start: string, end?: string) => ({ id, start, end });

describe('fertility estimates', () => {
  it('places ovulation ~14 days before the next start', () => {
    const f = fertilityFor('2026-11-01', 28, 5);
    expect(f.ovulation).toBe('2026-11-15');
    expect(f.fertileStart).toBe('2026-11-10');
    expect(f.fertileEnd).toBe('2026-11-16');
  });

  it('never puts ovulation inside the period for very short cycles', () => {
    expect(fertilityFor('2026-11-01', 16, 5).ovulation).toBe('2026-11-07');
  });

  it('uses the real next start for past cycles', () => {
    const w = cycleWindows([P('a', '2026-09-01', '2026-09-05'), P('b', '2026-10-01', '2026-10-05')], S, '2026-10-10', '2026-11-30');
    expect(w[0]).toMatchObject({ recorded: true, end: '2026-09-30', ovulation: '2026-09-17' });
    expect(w.some((x) => !x.recorded)).toBe(true);
  });

  it('does not invent cycles across long unlogged gaps', () => {
    const map = classifyDays([P('a', '2026-01-01', '2026-01-05'), P('b', '2026-06-01', '2026-06-05')], S, '2026-06-10', '2026-01-01', '2026-05-31');
    expect(map.get('2026-01-03')).toBe('period');
    expect(map.has('2026-03-15')).toBe(false);
  });
});

describe('classifyDays', () => {
  const periods = [P('a', '2026-11-01', '2026-11-05')];
  const map = classifyDays(periods, { ...S, autoAverage: false, cycleLength: 28, periodLength: 5 }, '2026-11-03', '2026-11-01', '2026-12-31');

  it('marks recorded, safe, fertile, ovulation and predicted days', () => {
    expect(map.get('2026-11-01')).toBe('period');
    expect(map.get('2026-11-05')).toBe('period');
    expect(map.get('2026-11-06')).toBe('safe');
    expect(map.get('2026-11-10')).toBe('fertile');
    expect(map.get('2026-11-15')).toBe('ovulation');
    expect(map.get('2026-11-17')).toBe('safe');
    expect(map.get('2026-11-29')).toBe('predicted');
    expect(map.get('2026-12-03')).toBe('predicted');
    expect(map.get('2026-12-04')).toBe('safe');
    expect(map.get('2026-12-13')).toBe('ovulation');
  });

  it('shows the rest of an ongoing period as predicted', () => {
    const m = classifyDays([{ id: 'a', start: '2026-11-01' }], { ...S, autoAverage: false, periodLength: 6 }, '2026-11-03', '2026-11-01', '2026-11-08');
    expect(m.get('2026-11-03')).toBe('period');
    expect(m.get('2026-11-04')).toBe('predicted');
    expect(m.get('2026-11-06')).toBe('predicted');
    expect(m.get('2026-11-07')).toBe('safe');
  });

  it('returns nothing without data', () => {
    expect(classifyDays([], S, '2026-11-03', '2026-11-01', '2026-11-30').size).toBe(0);
  });
});

describe('currentPhase', () => {
  const s = { ...S, autoAverage: false };
  const periods = [P('a', '2026-11-01', '2026-11-06')];
  it('covers before, during and after the period', () => {
    expect(currentPhase([], s, '2026-11-03').kind).toBe('none');
    expect(currentPhase(periods, s, '2026-11-03')).toMatchObject({ kind: 'period', periodDay: 3, recordedEnd: true });
    expect(currentPhase([P('a', '2026-11-01')], s, '2026-11-03')).toMatchObject({ kind: 'period', endsIn: 2 });
    expect(currentPhase(periods, s, '2026-11-08')).toMatchObject({ kind: 'beforeFertile', daysUntil: 2 });
    expect(currentPhase(periods, s, '2026-11-12')).toMatchObject({ kind: 'fertile', daysUntilOvulation: 3 });
    expect(currentPhase(periods, s, '2026-11-20')).toMatchObject({ kind: 'luteal', daysUntil: 9 });
    expect(currentPhase(periods, s, '2026-12-02')).toMatchObject({ kind: 'late', daysLate: 3 });
  });
});

describe('isIrregular', () => {
  it('flags widely varying cycles only', () => {
    const reg = [P('a', '2026-01-01'), P('b', '2026-01-29'), P('c', '2026-02-27'), P('d', '2026-03-27')];
    const irr = [P('a', '2026-01-01'), P('b', '2026-01-23'), P('c', '2026-03-01'), P('d', '2026-03-26')];
    expect(isIrregular(reg)).toBe(false);
    expect(isIrregular(irr)).toBe(true);
  });
});
