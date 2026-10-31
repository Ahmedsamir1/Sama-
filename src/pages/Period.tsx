import { useMemo, useState } from 'react';
import { Sheet, PageTitle, Toggle } from '../components/UI';
import { useBurst } from '../components/Effects';
import {
  cycleLengths,
  cycleStatus,
  periodEnd,
  predictedPeriods,
  sortPeriods,
  validatePeriod,
  type PeriodRecord,
} from '../lib/cycle';
import { addDays, diffDays, fromISO, isBetween, monthGrid, type ISODate } from '../lib/dates';
import { newId } from '../lib/db';
import { formatDate, MOOD_EMOJI, type Dict } from '../lib/i18n';
import { useStore } from '../lib/store';

type ErrKey = 'errEndBeforeStart' | 'errTooLong' | 'errOverlap' | 'errNoOpen';

export function Period() {
  const store = useStore();
  const { t, periods, settings, today, moods, savePeriod, showToast } = store;
  const lang = settings.language;
  const [burstLayer, burst] = useBurst();
  const [cursor, setCursor] = useState(() => {
    const d = fromISO(today);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState<ISODate | null>(null);
  const [editing, setEditing] = useState<PeriodRecord | null>(null);

  const sorted = useMemo(() => sortPeriods(periods), [periods]);
  const status = useMemo(() => cycleStatus(periods, settings, today), [periods, settings, today]);
  const predictions = useMemo(() => predictedPeriods(periods, settings, today, 4), [periods, settings, today]);
  const lengths = useMemo(() => cycleLengths(periods), [periods]);
  const moodByDate = useMemo(() => new Map(moods.map((m) => [m.date, m])), [moods]);

  const ongoing = useMemo(() => {
    const last = sorted.filter((p) => p.start <= today).at(-1);
    return last && !last.end && diffDays(last.start, today) <= 14 ? last : undefined;
  }, [sorted, today]);

  const periodOn = (day: ISODate) => sorted.find((p) => isBetween(day, p.start, periodEnd(p, settings, today)));
  const predictedOn = (day: ISODate) => predictions.some((r) => isBetween(day, r.start, r.end));

  const errMsg = (k: string) => t[k as ErrKey] ?? k;

  async function trySave(rec: PeriodRecord): Promise<boolean> {
    const err = validatePeriod(rec, periods);
    if (err) {
      showToast(errMsg(err));
      return false;
    }
    await savePeriod(rec);
    showToast(t.saved);
    return true;
  }

  async function markStart(day: ISODate, e?: { clientX: number; clientY: number }) {
    if (await trySave({ id: newId(), start: day })) {
      if (e) burst(e.clientX, e.clientY, ['🩸', '💗', '🌸'], 10);
      setSelected(null);
    }
  }

  async function markEnd(day: ISODate) {
    const candidate = sorted.filter((p) => p.start <= day && diffDays(p.start, day) <= 15).at(-1);
    if (!candidate) return showToast(t.errNoOpen);
    if (await trySave({ ...candidate, end: day })) setSelected(null);
  }

  const cells = monthGrid(cursor.y, cursor.m, t.weekStartsOn);
  const monthLabel = new Intl.DateTimeFormat(t.locale, { month: 'long', year: 'numeric' }).format(new Date(cursor.y, cursor.m, 1));
  const shiftMonth = (delta: number) =>
    setCursor(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const selPeriod = selected ? periodOn(selected) : undefined;

  return (
    <div className="space-y-4">
      {burstLayer}
      <PageTitle title={t.periodTitle} />

      <div className="grid grid-cols-1 gap-2">
        {ongoing ? (
          <button className="btn btn-primary w-full" onClick={() => markEnd(today)}>
            🌸 {t.endToday}
          </button>
        ) : (
          <button className="btn btn-primary w-full" onClick={(e) => markStart(today, e)}>
            🩸 {t.startToday}
          </button>
        )}
      </div>

      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <button className="btn btn-soft h-10 w-10 !p-0" onClick={() => shiftMonth(-1)} aria-label="previous month">
            <span dir="ltr">{lang === 'ar' ? '›' : '‹'}</span>
          </button>
          <button
            className="text-lg font-extrabold text-blush-600"
            onClick={() => {
              const d = fromISO(today);
              setCursor({ y: d.getFullYear(), m: d.getMonth() });
            }}
          >
            {monthLabel}
          </button>
          <button className="btn btn-soft h-10 w-10 !p-0" onClick={() => shiftMonth(1)} aria-label="next month">
            <span dir="ltr">{lang === 'ar' ? '‹' : '›'}</span>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-ink/50">
          {t.weekdays.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />;
            const isPeriod = !!periodOn(day);
            const isPred = !isPeriod && predictedOn(day);
            const isToday = day === today;
            const mood = moodByDate.get(day)?.mood;
            return (
              <button
                key={day}
                onClick={() => setSelected(day)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm font-bold transition-transform active:scale-90 ${
                  isPeriod
                    ? 'bg-gradient-to-br from-blush-300 to-blush-500 text-white shadow-sm'
                    : isPred
                      ? 'border-2 border-dashed border-blush-300 bg-blush-50 text-blush-600'
                      : 'bg-white/60'
                } ${isToday ? 'ring-2 ring-lav-500 ring-offset-1' : ''}`}
                aria-label={formatDate(day, lang)}
              >
                <span className="tabular-nums">{fromISO(day).getDate()}</span>
                {mood && <span className="absolute -bottom-0.5 text-[10px] leading-none">{MOOD_EMOJI[mood]}</span>}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-[11px] text-ink/70">
          <Legend className="bg-blush-400" label={t.legendPeriod} />
          <Legend className="border-2 border-dashed border-blush-300 bg-blush-50" label={t.legendPredicted} />
          <Legend className="ring-2 ring-lav-500" label={t.legendToday} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Stat label={t.avgCycle} value={t.lengthDays(status.averageLength)} hint={t.basedOn(settings.autoAverage ? Math.min(lengths.length, 6) : 0)} />
        <Stat label={t.avgPeriod} value={t.lengthDays(status.periodLength)} hint={status.nextStart ? `${t.nextPeriod}: ${formatDate(status.nextStart, lang)}` : ''} />
      </section>

      <p className="rounded-2xl bg-lav-100/80 p-3 text-xs leading-relaxed text-ink/80">⚠️ {t.predictionDisclaimer}</p>

      <section className="card p-4">
        <h2 className="mb-3 font-extrabold text-blush-600">{t.history}</h2>
        {sorted.length === 0 && <p className="text-sm text-ink/60">{t.noHistory}</p>}
        <ul className="space-y-2">
          {[...sorted].reverse().map((p) => {
            const idx = sorted.indexOf(p);
            const next = sorted[idx + 1];
            const len = p.end ? diffDays(p.start, p.end) + 1 : null;
            const cycle = next ? diffDays(p.start, next.start) : null;
            return (
              <li key={p.id}>
                <button className="flex w-full items-center justify-between rounded-2xl bg-blush-50 px-4 py-3 text-start" onClick={() => setEditing(p)}>
                  <div>
                    <p className="font-bold">
                      {formatDate(p.start, lang, { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' – '}
                      {p.end ? formatDate(p.end, lang, { day: 'numeric', month: 'short' }) : t.ongoing}
                    </p>
                    <p className="text-xs text-ink/60">
                      {len ? t.lengthDays(len) : ''}
                      {cycle ? ` · ${t.cycleLen}: ${t.lengthDays(cycle)}` : ''}
                    </p>
                  </div>
                  <span className="text-blush-400">✎</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected ? formatDate(selected, lang, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}>
        {selected && (
          <div className="space-y-2 pb-4">
            {moodByDate.get(selected)?.mood && (
              <p className="pb-2 text-center text-sm">
                {MOOD_EMOJI[moodByDate.get(selected)!.mood!]} {t.moods[moodByDate.get(selected)!.mood!]}
              </p>
            )}
            {selected > today ? (
              predictedOn(selected) && <p className="text-center text-sm text-ink/70">{t.legendPredicted} — {t.estimateNote}</p>
            ) : selPeriod ? (
              <>
                <button className="btn btn-soft w-full" onClick={() => markEnd(selected)}>
                  🌸 {t.markEnd}
                </button>
                <button
                  className="btn btn-soft w-full"
                  onClick={() => {
                    setEditing(selPeriod);
                    setSelected(null);
                  }}
                >
                  ✎ {t.editPeriod}
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-primary w-full" onClick={(e) => markStart(selected, e)}>
                  🩸 {t.markStart}
                </button>
                <button className="btn btn-soft w-full" onClick={() => markEnd(selected)}>
                  🌸 {t.markEnd}
                </button>
              </>
            )}
          </div>
        )}
      </Sheet>

      {editing && <EditPeriodSheet key={editing.id} record={editing} onClose={() => setEditing(null)} t={t} trySave={trySave} />}
    </div>
  );
}

function EditPeriodSheet({
  record,
  onClose,
  t,
  trySave,
}: {
  record: PeriodRecord;
  onClose: () => void;
  t: Dict;
  trySave: (r: PeriodRecord) => Promise<boolean>;
}) {
  const { deletePeriod, today } = useStore();
  const [draft, setDraft] = useState<PeriodRecord>(() => ({ ...record }));
  const close = onClose;

  return (
    <Sheet open onClose={close} title={t.editPeriod}>
      {(
        <div className="space-y-4 pb-4">
          <label className="block">
            <span className="text-sm font-semibold">{t.startDate}</span>
            <input
              type="date"
              max={today}
              value={draft.start}
              onChange={(e) => e.target.value && setDraft({ ...draft, start: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-blush-200 bg-white px-4 py-3"
            />
          </label>
          <Toggle
            checked={!draft.end}
            label={t.noEndYet}
            onChange={(v) => setDraft({ ...draft, end: v ? undefined : draft.end ?? (addDays(draft.start, 4) > today ? today : addDays(draft.start, 4)) })}
          />
          {draft.end && (
            <label className="block">
              <span className="text-sm font-semibold">{t.endDate}</span>
              <input
                type="date"
                min={draft.start}
                max={today}
                value={draft.end}
                onChange={(e) => e.target.value && setDraft({ ...draft, end: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-blush-200 bg-white px-4 py-3"
              />
            </label>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn btn-primary"
              onClick={async () => {
                if (await trySave(draft)) close();
              }}
            >
              {t.save}
            </button>
            <button className="btn btn-soft" onClick={close}>
              {t.cancel}
            </button>
          </div>
          <button
            className="w-full py-2 text-sm font-bold text-red-500"
            onClick={async () => {
              if (window.confirm(t.confirmDeletePeriod)) {
                await deletePeriod(draft.id);
                close();
              }
            }}
          >
            🗑 {t.removePeriod}
          </button>
        </div>
      )}
    </Sheet>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3.5 w-3.5 rounded-md ${className}`} />
      {label}
    </span>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-bold text-lav-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-blush-600">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-ink/60">{hint}</p>}
    </div>
  );
}
