import { useMemo, useState } from 'react';
import { Sheet, Toggle } from '../components/UI';
import { CycleCard } from '../components/CycleCard';
import { CycleCalendar, kindLabel } from '../components/CycleCalendar';
import { HealthLog } from '../components/HealthLog';
import { classifyDays, cycleLengths, cycleStatus, periodEnd, type PeriodRecord } from '../lib/cycle';
import { addDays, diffDays, isBetween, type ISODate } from '../lib/dates';
import { formatDate, type Dict } from '../lib/i18n';
import { useStore } from '../lib/store';
import { usePeriodActions } from '../lib/usePeriodActions';

export function Period() {
  const { t, periods, settings, today } = useStore();
  const lang = settings.language;
  const { sorted, trySave, markStart, markEnd } = usePeriodActions();
  const [selected, setSelected] = useState<ISODate>(today);
  const [tab, setTab] = useState<'health' | 'history'>('health');
  const [editing, setEditing] = useState<PeriodRecord | null>(null);

  const status = useMemo(() => cycleStatus(periods, settings, today), [periods, settings, today]);
  const lengths = useMemo(() => cycleLengths(periods), [periods]);
  const selKind = useMemo(() => classifyDays(periods, settings, today, selected, selected).get(selected), [periods, settings, today, selected]);
  const selPeriod = sorted.find((p) => isBetween(selected, p.start, periodEnd(p, settings, today)));
  const isFuture = selected > today;

  return (
    <div className="space-y-4">
      <CycleCard />

      <CycleCalendar selected={selected} onSelect={setSelected} />

      <p className="rounded-2xl bg-lav-100/80 p-3 text-xs leading-relaxed text-ink/80">⚠️ {t.fertilityNote}</p>

      <section className="overflow-hidden rounded-[1.4rem] bg-white shadow-[0_10px_28px_-16px_rgb(214_58_116/0.35)]">
        <div className="flex gap-6 border-b border-ink/5 px-5 pt-3" role="tablist">
          {(['health', 'history'] as const).map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`relative pb-3 text-[17px] font-semibold transition-colors ${tab === id ? 'text-[#2f2329]' : 'text-ink/40'}`}
            >
              {id === 'health' ? t.healthNotes : t.cycleHistory}
              {tab === id && <span className="absolute inset-x-1/4 bottom-0 h-1 rounded-full bg-[#ff5d8f]" />}
            </button>
          ))}
        </div>

        {tab === 'health' ? (
          <div className="px-5 pt-3 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-[#2f2329]">{t.logFor(formatDate(selected, lang, { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
              {selKind && (
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    selKind === 'period' ? 'bg-[#ff5d8f] text-white' : 'bg-blush-50 text-ink/70'
                  }`}
                >
                  {kindLabel(selKind, t)} · {selKind === 'period' ? t.actual : t.estimated}
                </span>
              )}
            </div>

            {isFuture ? (
              <p className="py-6 text-center text-sm text-ink/60">🔮 {t.futureDay}</p>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {selPeriod ? (
                    <>
                      <button className="btn btn-soft !px-2 !py-2.5 text-[13px] whitespace-nowrap" onClick={() => markEnd(selected)}>
                        🌸 {t.markEnd}
                      </button>
                      <button className="btn btn-soft !px-2 !py-2.5 text-[13px] whitespace-nowrap" onClick={() => setEditing(selPeriod)}>
                        ✎ {t.editPeriod}
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn !px-2 !py-2.5 bg-[#ff5d8f] text-[13px] whitespace-nowrap text-white" onClick={() => markStart(selected)}>
                        🩸 {t.markStart}
                      </button>
                      <button className="btn btn-soft !px-2 !py-2.5 text-[13px] whitespace-nowrap" onClick={() => markEnd(selected)}>
                        🌸 {t.markEnd}
                      </button>
                    </>
                  )}
                </div>
                <HealthLog date={selected} />
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label={t.avgCycle} value={t.lengthDays(status.averageLength)} hint={t.basedOn(settings.autoAverage ? Math.min(lengths.length, 6) : 0)} />
              <Stat label={t.avgPeriod} value={t.lengthDays(status.periodLength)} hint={status.nextStart ? `${t.nextPeriod}: ${formatDate(status.nextStart, lang)}` : ''} />
            </div>
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
            <p className="text-[11px] leading-relaxed text-ink/60">{t.predictionDisclaimer}</p>
          </div>
        )}
      </section>

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

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-blush-50 p-3">
      <p className="text-xs font-bold text-lav-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-blush-600">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-ink/60">{hint}</p>}
    </div>
  );
}
