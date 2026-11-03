import { useMemo } from 'react';
import { sortPeriods, validatePeriod, type PeriodRecord } from './cycle';
import { diffDays, type ISODate } from './dates';
import { newId } from './db';
import { useStore } from './store';

type ErrKey = 'errEndBeforeStart' | 'errTooLong' | 'errOverlap' | 'errNoOpen';

/** Shared save/start/end logic for period records (used by the cycle card and the calendar). */
export function usePeriodActions() {
  const { t, periods, today, savePeriod, showToast } = useStore();
  const sorted = useMemo(() => sortPeriods(periods), [periods]);

  const ongoing = useMemo(() => {
    const last = sorted.filter((p) => p.start <= today).at(-1);
    return last && !last.end && diffDays(last.start, today) <= 14 ? last : undefined;
  }, [sorted, today]);

  async function trySave(rec: PeriodRecord): Promise<boolean> {
    const err = validatePeriod(rec, periods);
    if (err) {
      showToast(t[err as ErrKey] ?? err);
      return false;
    }
    await savePeriod(rec);
    showToast(t.saved);
    return true;
  }

  const markStart = (day: ISODate) => trySave({ id: newId(), start: day });

  async function markEnd(day: ISODate): Promise<boolean> {
    const candidate = sorted.filter((p) => p.start <= day && diffDays(p.start, day) <= 15).at(-1);
    if (!candidate) {
      showToast(t.errNoOpen);
      return false;
    }
    return trySave({ ...candidate, end: day });
  }

  return { sorted, ongoing, trySave, markStart, markEnd };
}
