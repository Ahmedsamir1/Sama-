import { useMemo } from 'react';
import { Bunny } from '../components/Bunny';
import { useBurst } from '../components/Effects';
import { cycleStatus } from '../lib/cycle';
import { formatDate, greetingFor, MOOD_EMOJI } from '../lib/i18n';
import { useStore } from '../lib/store';
import { messageOfTheDay } from '../data/messages';
import { MOOD_IDS } from '../lib/backup';
import type { Tab } from './types';

export function Home({ go }: { go: (t: Tab) => void }) {
  const { t, settings, periods, moods, today, saveMood, showToast } = useStore();
  const [burstLayer, burst] = useBurst();
  const status = useMemo(() => cycleStatus(periods, settings, today), [periods, settings, today]);
  const todayMood = moods.find((m) => m.date === today);
  const message = messageOfTheDay(today);
  const lang = settings.language;
  const progress = status.cycleDay ? Math.min(1, status.cycleDay / status.averageLength) : 0;

  return (
    <div className="space-y-4">
      {burstLayer}
      <section className="card animate-pop relative overflow-hidden p-5">
        <div className="absolute -end-6 -top-6 h-28 w-28 rounded-full bg-lav-200/60 blur-2xl" />
        <div className="flex items-center gap-3">
          <button
            className="animate-bob shrink-0"
            onClick={(e) => burst(e.clientX, e.clientY)}
            aria-label="🐰"
          >
            <Bunny size={96} holding="heart" mood={new Date().getHours() >= 22 || new Date().getHours() < 4 ? 'sleepy' : 'happy'} />
          </button>
          <div>
            <h1 className="text-2xl leading-snug font-extrabold text-blush-600">{greetingFor(new Date().getHours(), t)}</h1>
            <p className="mt-1 text-sm text-ink/70">{formatDate(today, lang, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <p className="mt-1 text-xs text-lav-500">{t.tagline}</p>
          </div>
        </div>
      </section>

      {status.hasData ? (
        <section className="card animate-pop grid grid-cols-[auto_1fr] items-center gap-4 p-5" style={{ animationDelay: '60ms' }}>
          <div className="relative h-28 w-28">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#ffe4ef" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#ring)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${progress * 264} 264`}
                style={{ transition: 'stroke-dasharray 0.8s ease' }}
              />
              <defs>
                <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ff78a9" />
                  <stop offset="1" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-ink/60">{t.cycleDay}</span>
              <span className="text-3xl font-black text-blush-600 tabular-nums">{status.cycleDay}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-lav-500">{t.nextPeriod}</p>
            <p className="text-xl font-extrabold">{formatDate(status.nextStart!, lang, { weekday: 'short', day: 'numeric', month: 'long' })}</p>
            <p className="text-sm text-ink/70">
              {status.daysUntilNext! >= 0 ? t.inDays(status.daysUntilNext!) : t.lateDays(-status.daysUntilNext!)}
            </p>
            {status.onPeriod && <p className="text-sm font-semibold text-blush-500">{t.onPeriodNow}</p>}
            <p className="pt-1 text-[11px] text-ink/50">{t.estimateNote}</p>
          </div>
        </section>
      ) : (
        <section className="card animate-pop flex items-center gap-4 p-5">
          <Bunny size={72} holding="moon" mood="wink" />
          <div className="flex-1">
            <p className="font-extrabold text-blush-600">{t.noDataTitle}</p>
            <p className="mb-3 text-sm text-ink/70">{t.noDataBody}</p>
            <button className="btn btn-primary !py-2 text-sm" onClick={() => go('period')}>
              {t.goRecord}
            </button>
          </div>
        </section>
      )}

      <section className="card animate-pop relative overflow-hidden p-5" style={{ animationDelay: '120ms' }}>
        <p className="mb-2 text-xs font-bold text-lav-500">{t.dailyMessage}</p>
        <p className="text-lg leading-relaxed font-bold" dir="rtl" lang="ar">
          {message}
        </p>
        <div className="mt-3 flex justify-between">
          <span className="animate-heartbeat text-2xl">💗</span>
          <button className="text-sm font-bold text-blush-500" onClick={() => go('ahmed')}>
            {t.navAhmed} {lang === 'ar' ? '←' : '→'}
          </button>
        </div>
      </section>

      <section className="card animate-pop p-5" style={{ animationDelay: '180ms' }}>
        <p className="mb-3 text-xs font-bold text-lav-500">{todayMood?.mood ? t.todayMood : t.pickMood}</p>
        <div className="grid grid-cols-6 gap-1.5">
          {MOOD_IDS.map((id) => {
            const active = todayMood?.mood === id;
            return (
              <button
                key={id}
                aria-label={t.moods[id]}
                aria-pressed={active}
                className={`flex aspect-square items-center justify-center rounded-2xl text-2xl transition-all ${
                  active ? 'scale-110 bg-blush-200 shadow-md' : 'bg-blush-50'
                }`}
                onClick={async (e) => {
                  burst(e.clientX, e.clientY, [MOOD_EMOJI[id], '💕'], 8);
                  await saveMood({ date: today, symptoms: todayMood?.symptoms ?? [], note: todayMood?.note, mood: id });
                  showToast(t.moodReplies[id]);
                }}
              >
                {MOOD_EMOJI[id]}
              </button>
            );
          })}
        </div>
        {todayMood?.mood && <p className="mt-3 text-center text-sm font-semibold text-blush-600">{t.moods[todayMood.mood]}</p>}
      </section>
    </div>
  );
}
