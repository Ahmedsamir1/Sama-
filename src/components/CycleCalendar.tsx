import { useMemo, useRef, useState } from 'react';
import { classifyDays, type DayKind } from '../lib/cycle';
import { fromISO, monthGrid, type ISODate } from '../lib/dates';
import { formatDate, type Dict } from '../lib/i18n';
import { useStore } from '../lib/store';

const TEXT: Record<DayKind, string> = {
  period: 'text-white',
  predicted: 'text-[#ff5d8f]',
  ovulation: 'text-[#e8930c]',
  fertile: 'text-[#c45ce0]',
  safe: 'text-[#5b8def]',
};
const BAND: Partial<Record<DayKind, string>> = {
  period: 'bg-[#ff5d8f]',
  predicted: 'bg-[#ffe3ec]',
};

export function Flower({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M20 3.5c3 0 4.6 2.6 5.3 4.4 1.7-.9 4.6-1.8 6.7.3s1.2 5 .3 6.7c1.8.7 4.4 2.3 4.4 5.3s-2.6 4.6-4.4 5.3c.9 1.7 1.8 4.6-.3 6.7s-5 1.2-6.7.3c-.7 1.8-2.3 4.4-5.3 4.4s-4.6-2.6-5.3-4.4c-1.7.9-4.6 1.8-6.7-.3s-1.2-5-.3-6.7C5.9 24.6 3.5 23 3.5 20s2.6-4.6 4.4-5.3c-.9-1.7-1.8-4.6.3-6.7s5-1.2 6.7-.3C15.4 6.1 17 3.5 20 3.5z"
        fill="#ffe8b8"
        stroke="#f5b84a"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function CycleCalendar({ selected, onSelect }: { selected: ISODate; onSelect: (d: ISODate) => void }) {
  const { t, periods, settings, today, moods } = useStore();
  const lang = settings.language;
  const rtl = lang === 'ar';
  const [cursor, setCursor] = useState(() => {
    const d = fromISO(today);
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const touch = useRef<{ x: number; y: number } | null>(null);

  const cells = monthGrid(cursor.y, cursor.m, t.weekStartsOn);
  const days = cells.filter((c): c is ISODate => !!c);
  const kinds = useMemo(
    () => classifyDays(periods, settings, today, days[0], days[days.length - 1]),
    [periods, settings, today, cursor.y, cursor.m],
  );
  const logged = useMemo(() => new Set(moods.map((m) => m.date)), [moods]);

  const shift = (delta: number) =>
    setCursor(({ y, m }) => {
      const d = new Date(y, m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const goToday = () => {
    const d = fromISO(today);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
    onSelect(today);
  };
  const viewingToday = fromISO(today).getFullYear() === cursor.y && fromISO(today).getMonth() === cursor.m;
  const monthLabel = new Intl.DateTimeFormat(t.locale, { month: 'long', year: 'numeric' }).format(new Date(cursor.y, cursor.m, 1));

  const weeks: (ISODate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <section
      className="overflow-hidden rounded-[1.4rem] bg-white shadow-[0_10px_28px_-16px_rgb(214_58_116/0.35)]"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const s = touch.current;
        touch.current = null;
        if (!s) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        // Finger moving right reveals the month that sits on the left: next in RTL, previous in LTR.
        shift(dx > 0 === rtl ? 1 : -1);
      }}
    >
      <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <div className="flex items-center gap-1">
          <NavBtn label={t.prevMonth} onClick={() => shift(-1)} glyph={rtl ? '›' : '‹'} />
          <h2 className="min-w-[8.5rem] text-center text-xl font-bold text-[#2f2329]" aria-live="polite">
            {monthLabel}
          </h2>
          <NavBtn label={t.nextMonth} onClick={() => shift(1)} glyph={rtl ? '‹' : '›'} />
        </div>
        <button
          className={`text-[13px] font-semibold transition-colors ${viewingToday && selected === today ? 'text-ink/35' : 'text-[#ff5d8f]'}`}
          onClick={goToday}
        >
          {t.backToToday}
        </button>
      </header>

      <div className="grid grid-cols-7 border-b border-ink/5 pb-2 text-center text-[11.5px] font-medium text-ink/75">
        {t.weekdaysFull.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div key={`${cursor.y}-${cursor.m}`} className="animate-pop" style={{ animationDuration: '0.3s' }}>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-ink/5 py-2.5">
            {week.map((day, i) => {
              if (!day) return <div key={`e${wi}-${i}`} />;
              const kind = kinds.get(day);
              const band = kind ? BAND[kind] : undefined;
              const prevSame = !!band && !!week[i - 1] && kinds.get(week[i - 1]!) === kind;
              const nextSame = !!band && !!week[i + 1] && kinds.get(week[i + 1]!) === kind;
              const isToday = day === today;
              const isSel = day === selected;
              const label = `${formatDate(day, lang, { weekday: 'long', day: 'numeric', month: 'long' })}${
                kind ? ` · ${kindLabel(kind, t)}` : ''
              }`;
              return (
                <button
                  key={day}
                  onClick={() => onSelect(day)}
                  aria-label={label}
                  aria-pressed={isSel}
                  className={`relative flex h-11 items-center justify-center transition-transform active:scale-90 ${band ?? ''} ${
                    band && !prevSame ? 'ms-1 rounded-s-full' : ''
                  } ${band && !nextSame ? 'me-1 rounded-e-full' : ''}`}
                >
                  {kind === 'ovulation' && !isToday && <Flower size={44} className="absolute" />}
                  {isToday ? (
                    <span className="relative flex h-10 w-10 flex-col items-center justify-center rounded-full bg-white text-[12px] leading-none font-bold text-[#ff5d8f] ring-2 ring-[#ff5d8f]">
                      {t.todayShort}
                      <span className="mt-0.5 text-[10px] font-semibold opacity-80 tabular-nums">{fromISO(day).getDate()}</span>
                    </span>
                  ) : (
                    <span
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full text-[19px] tabular-nums ${kind ? TEXT[kind] : 'text-ink/70'} ${
                        isSel ? (kind === 'period' ? 'ring-2 ring-white' : 'ring-2 ring-[#ff5d8f]/60') : ''
                      }`}
                    >
                      {fromISO(day).getDate()}
                    </span>
                  )}
                  {logged.has(day) && (
                    <span className={`absolute bottom-0 h-1.5 w-1.5 rounded-full ${kind === 'period' ? 'bg-white' : 'bg-[#ff5d8f]'}`} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <Legend />
    </section>
  );
}

function NavBtn({ label, onClick, glyph }: { label: string; onClick: () => void; glyph: string }) {
  return (
    <button className="flex h-9 w-9 items-center justify-center rounded-full text-2xl text-ink/40 active:bg-blush-50" onClick={onClick} aria-label={label}>
      <span dir="ltr">{glyph}</span>
    </button>
  );
}

export function kindLabel(kind: DayKind, t: Dict): string {
  return {
    period: t.legendPeriod,
    predicted: t.legendNext,
    ovulation: t.legendOvulation,
    fertile: t.legendFertile,
    safe: t.legendSafe,
  }[kind];
}

function Legend() {
  const { t } = useStore();
  const dot = (c: string) => <span className={`inline-block h-2.5 w-2.5 rounded-full ${c}`} />;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 px-3 py-3 text-[11.5px] text-ink/75">
      <span className="flex items-center gap-1">{dot('bg-[#ff5d8f]')}{t.legendPeriod}</span>
      <span className="flex items-center gap-1">{dot('bg-[#ffb3c8]')}{t.legendNext}</span>
      <span className="flex items-center gap-1">{dot('bg-[#5b8def]')}{t.legendSafe}</span>
      <span className="flex items-center gap-1">{dot('bg-[#c45ce0]')}{t.legendFertile}</span>
      <span className="flex items-center gap-1">
        <Flower size={14} />
        {t.legendOvulation}
      </span>
    </div>
  );
}
