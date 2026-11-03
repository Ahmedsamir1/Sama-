import { useMemo, useState } from 'react';
import { Mochi, type MochiProp } from './Mochi';
import { Sheet, Stepper, Toggle } from './UI';
import { cycleStatus, currentPhase, isIrregular, MAX_CYCLE, MIN_CYCLE } from '../lib/cycle';
import { formatDate } from '../lib/i18n';
import { useStore } from '../lib/store';
import { usePeriodActions } from '../lib/usePeriodActions';

/** Hayah-style summary card: pink band, big white card, mascot and a large counter. */
export function CycleCard({ onEmpty }: { onEmpty?: () => void }) {
  const { t, periods, settings, today } = useStore();
  const lang = settings.language;
  const [adjusting, setAdjusting] = useState(false);
  const phase = useMemo(() => currentPhase(periods, settings, today), [periods, settings, today]);
  const status = useMemo(() => cycleStatus(periods, settings, today), [periods, settings, today]);
  const fmt = (d: string) => formatDate(d, lang, { weekday: 'long', day: 'numeric', month: 'long' });

  let label = t.phaseNone;
  let title = t.noDataTitle;
  let big: string | null = null;
  let sub = t.noDataBody;
  let prop: MochiProp = 'heart';
  let accent = 'text-blush-500';
  switch (phase.kind) {
    case 'period':
      label = t.phasePeriod;
      title = t.cardPeriodTitle;
      big = t.bigDayN(phase.periodDay);
      sub = phase.recordedEnd ? t.periodEndedRecorded(fmt(phase.endDate)) : phase.endsIn === 0 ? t.periodEndsToday : t.periodEndsOn(fmt(phase.endDate));
      prop = 'bottle';
      break;
    case 'beforeFertile':
      label = t.phaseSafe;
      title = t.cardBeforeFertileTitle;
      big = t.bigDays(phase.daysUntil);
      sub = t.fertileStartsOn(fmt(phase.date));
      prop = 'tea';
      accent = 'text-sky-500';
      break;
    case 'fertile':
      label = t.phaseFertile;
      title = t.cardFertileTitle;
      big = t.bigDays(phase.daysUntilOvulation);
      sub = t.ovulationOn(fmt(phase.ovulation));
      prop = 'flower';
      accent = 'text-fuchsia-500';
      break;
    case 'luteal':
      label = t.phaseSafe;
      title = t.cardLutealTitle;
      big = t.bigDays(phase.daysUntil);
      sub = t.nextStartsOn(fmt(phase.date));
      prop = 'tea';
      accent = 'text-sky-500';
      break;
    case 'late':
      label = t.phaseLate;
      title = t.cardLateTitle;
      big = t.bigDays(phase.daysLate);
      sub = t.lateBody;
      prop = 'heart';
      break;
  }

  return (
    <section className="animate-pop relative -mx-4 px-4 pt-2 pb-1">
      {/* pink band behind the card, curving into the page like the reference */}
      <div className="absolute inset-x-0 top-0 h-28 rounded-b-[45%_2.5rem] bg-gradient-to-b from-[#ff5d8f] to-[#ff7ea6]" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[1.4rem] bg-white p-5 shadow-[0_12px_30px_-14px_rgb(214_58_116/0.45)]">
        <div className="flex items-stretch gap-2">
          <div className="min-w-0 flex-1 py-1">
            <p className={`text-sm font-semibold ${phase.kind === 'none' ? 'text-ink/50' : accent} opacity-90`}>{label}</p>
            <p className="mt-1 text-lg font-bold text-ink">{title}</p>
            {big && <p className="mt-1 text-[2.9rem] leading-none font-black tracking-tight text-[#3a2a33] tabular-nums">{big}</p>}
            <p className="mt-3 text-[13px] leading-snug text-ink/55">{sub}</p>
            {status.cycleDay && phase.kind !== 'none' && (
              <p className="mt-1 text-[11px] text-ink/40">{t.cycleDayLine(status.cycleDay, status.averageLength)}</p>
            )}
          </div>
          <div className="relative flex w-[42%] shrink-0 flex-col items-center justify-end">
            <Mochi size={132} holding={prop} className="animate-bob -mb-6" />
            <button
              className="relative z-10 rounded-full bg-[#ff5d8f] px-4 py-2.5 text-[13px] font-bold whitespace-nowrap text-white shadow-[0_8px_18px_-8px_rgb(255_93_143/0.9)] transition-transform active:scale-95"
              onClick={() => (phase.kind === 'none' && onEmpty ? onEmpty() : setAdjusting(true))}
            >
              {phase.kind === 'none' && onEmpty ? t.goRecord : t.adjustCycle}
            </button>
          </div>
        </div>
        {isIrregular(periods) && <p className="mt-3 rounded-2xl bg-lav-100/70 px-3 py-2 text-[11px] leading-relaxed text-ink/70">🌸 {t.irregularNote}</p>}
      </div>
      <AdjustCycleSheet open={adjusting} onClose={() => setAdjusting(false)} />
    </section>
  );
}

export function AdjustCycleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, settings, periods, today, updateSettings } = useStore();
  const { ongoing, markStart, markEnd } = usePeriodActions();
  const status = cycleStatus(periods, settings, today);
  return (
    <Sheet open={open} onClose={onClose} title={t.adjustCycle}>
      <div className="space-y-3 pb-5">
        {ongoing ? (
          <button className="btn btn-primary w-full" onClick={async () => (await markEnd(today)) && onClose()}>
            🌸 {t.endToday}
          </button>
        ) : (
          <button className="btn btn-primary w-full" onClick={async () => (await markStart(today)) && onClose()}>
            🩸 {t.startToday}
          </button>
        )}
        <div className="rounded-3xl bg-white p-4 ring-1 ring-blush-100">
          <Toggle checked={settings.autoAverage} onChange={(v) => updateSettings({ autoAverage: v })} label={t.autoAverage} />
          <Stepper label={t.manualCycleLength} value={settings.cycleLength} min={MIN_CYCLE} max={MAX_CYCLE} onChange={(v) => updateSettings({ cycleLength: v })} />
          <Stepper label={t.manualPeriodLength} value={settings.periodLength} min={1} max={14} onChange={(v) => updateSettings({ periodLength: v })} />
          <p className="mt-1 text-xs text-ink/60">{t.autoHint}</p>
          <p className="mt-2 text-xs font-bold text-blush-500">{t.usingNow(status.averageLength, status.periodLength)}</p>
        </div>
        <p className="rounded-2xl bg-lav-100/80 p-3 text-xs leading-relaxed text-ink/80">⚠️ {t.fertilityNote}</p>
      </div>
    </Sheet>
  );
}
