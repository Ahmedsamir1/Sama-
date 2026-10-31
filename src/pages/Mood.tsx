import { useEffect, useMemo, useState } from 'react';
import { PageTitle } from '../components/UI';
import { useBurst } from '../components/Effects';
import { Bunny } from '../components/Bunny';
import { MOOD_IDS, whatsappLink } from '../lib/backup';
import type { MoodId } from '../lib/db';
import { formatDate, MOOD_EMOJI } from '../lib/i18n';
import { useStore } from '../lib/store';

const SYMPTOMS = ['cramps', 'headache', 'bloating', 'tired', 'backPain', 'cravings', 'acne', 'sleepy'];

export function Mood() {
  const { t, moods, today, settings, saveMood, showToast } = useStore();
  const lang = settings.language;
  const [burstLayer, burst] = useBurst();
  const [date, setDate] = useState(today);
  const entry = moods.find((m) => m.date === date);
  const [note, setNote] = useState(entry?.note ?? '');

  useEffect(() => setNote(entry?.note ?? ''), [date]);

  const recent = useMemo(() => [...moods].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30), [moods]);

  const base = { date, mood: entry?.mood, symptoms: entry?.symptoms ?? [], note: entry?.note };

  async function pick(id: MoodId, e: React.MouseEvent) {
    const mood = entry?.mood === id ? undefined : id;
    await saveMood({ ...base, mood });
    if (mood) {
      burst(e.clientX, e.clientY, [MOOD_EMOJI[id], '💖', '✨'], 12);
      showToast(t.moodReplies[id]);
    }
  }

  async function toggleSymptom(s: string) {
    const symptoms = base.symptoms.includes(s) ? base.symptoms.filter((x) => x !== s) : [...base.symptoms, s];
    await saveMood({ ...base, symptoms });
  }

  return (
    <div className="space-y-4">
      {burstLayer}
      <PageTitle
        title={t.moodTitle}
        right={
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="rounded-full border border-blush-200 bg-white/80 px-3 py-1.5 text-sm"
            aria-label="date"
          />
        }
      />

      <section className="card p-4">
        <p className="mb-3 text-center text-sm font-bold text-lav-500">
          {date === today ? t.todayMood : formatDate(date, lang, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {MOOD_IDS.map((id) => {
            const active = entry?.mood === id;
            return (
              <button
                key={id}
                onClick={(e) => pick(id, e)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-3xl px-3 py-3.5 text-start font-bold transition-all active:scale-95 ${
                  active ? 'bg-gradient-to-br from-blush-200 to-lav-200 shadow-md ring-2 ring-blush-300' : 'bg-blush-50'
                }`}
              >
                <span className={`text-3xl ${active ? 'animate-wiggle' : ''}`}>{MOOD_EMOJI[id]}</span>
                <span className="text-sm">{t.moods[id]}</span>
              </button>
            );
          })}
        </div>
        {entry?.mood && (
          <div className="animate-pop mt-4 flex items-center gap-3 rounded-3xl bg-cream-100 p-3">
            <Bunny size={56} holding={entry.mood === 'chocolate' ? 'chocolate' : 'heart'} mood={entry.mood === 'leaveMe' ? 'sleepy' : 'happy'} />
            <p className="flex-1 text-sm font-semibold">{t.moodReplies[entry.mood]}</p>
          </div>
        )}
        {entry?.mood && date === today && (
          <a
            className="btn btn-soft mt-3 w-full text-sm"
            href={whatsappLink(settings.whatsappNumber, `${MOOD_EMOJI[entry.mood]} ${t.moods[entry.mood]}`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            💬 {t.tellAhmed}
          </a>
        )}
      </section>

      <section className="card p-4">
        <p className="mb-3 text-sm font-bold text-lav-500">{t.symptoms}</p>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => {
            const on = base.symptoms.includes(s);
            return (
              <button
                key={s}
                aria-pressed={on}
                onClick={() => toggleSymptom(s)}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-all ${on ? 'bg-blush-400 text-white shadow' : 'bg-blush-50 text-ink'}`}
              >
                {t.symptomList[s]}
              </button>
            );
          })}
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-bold text-lav-500">{t.note}</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => note !== (entry?.note ?? '') && saveMood({ ...base, note: note.trim() ? note : undefined })}
            maxLength={1000}
            rows={3}
            placeholder={t.notePlaceholder}
            className="mt-1 w-full resize-none rounded-2xl border border-blush-200 bg-white px-4 py-3"
          />
        </label>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-extrabold text-blush-600">{t.moodHistory}</h2>
        {recent.length === 0 && <p className="text-sm text-ink/60">{t.noMoods}</p>}
        <ul className="space-y-2">
          {recent.map((m) => (
            <li key={m.date}>
              <button className="flex w-full items-center gap-3 rounded-2xl bg-blush-50 px-3 py-2.5 text-start" onClick={() => setDate(m.date)}>
                <span className="text-2xl">{m.mood ? MOOD_EMOJI[m.mood] : '📝'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {formatDate(m.date, lang, { weekday: 'short', day: 'numeric', month: 'short' })}
                    {m.mood ? ` · ${t.moods[m.mood]}` : ''}
                  </p>
                  {(m.symptoms.length > 0 || m.note) && (
                    <p className="truncate text-xs text-ink/60">
                      {m.symptoms.map((s) => t.symptomList[s] ?? s).join('، ')}
                      {m.note ? `${m.symptoms.length ? ' · ' : ''}${m.note}` : ''}
                    </p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
