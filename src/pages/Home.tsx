import { Bunny } from '../components/Bunny';
import { useBurst } from '../components/Effects';
import { CycleCard } from '../components/CycleCard';
import { formatDate, greetingFor, MOOD_EMOJI } from '../lib/i18n';
import { useStore } from '../lib/store';
import { messageOfTheDay } from '../data/messages';
import { MOOD_IDS } from '../lib/backup';
import type { Tab } from './types';

export function Home({ go }: { go: (t: Tab) => void }) {
  const { t, settings, moods, today, saveMood, showToast } = useStore();
  const [burstLayer, burst] = useBurst();
  const todayMood = moods.find((m) => m.date === today);
  const message = messageOfTheDay(today);
  const lang = settings.language;

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

      <CycleCard onEmpty={() => go('period')} />

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

      <button
        className="card animate-pop flex w-full items-center gap-3 bg-gradient-to-br from-blush-100 to-lav-100 p-4 text-start transition-transform active:scale-[0.98]"
        style={{ animationDelay: '150ms' }}
        onClick={() => go('requests')}
      >
        <span className="animate-heartbeat text-3xl">💝</span>
        <span className="flex-1">
          <span className="block font-extrabold text-blush-600">{t.requestsTitle}</span>
          <span className="block text-xs text-ink/70">{t.requestsSubtitle}</span>
        </span>
        <span className="text-blush-400">{lang === 'ar' ? '←' : '→'}</span>
      </button>

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
                  await saveMood({ ...todayMood, date: today, symptoms: todayMood?.symptoms ?? [], mood: id });
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
