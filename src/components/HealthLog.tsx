import { useState, type ReactNode } from 'react';
import { Sheet } from './UI';
import { MOOD_IDS } from '../lib/backup';
import type { FlowLevel, MoodEntry } from '../lib/db';
import { MOOD_EMOJI, type Dict } from '../lib/i18n';
import { useStore } from '../lib/store';
import type { ISODate } from '../lib/dates';

type Field = 'flow' | 'weight' | 'water' | 'health' | 'pain' | 'mood' | 'note';

export const HEALTH_SYMPTOMS = [
  'cramps',
  'headache',
  'bloating',
  'tired',
  'backPain',
  'nausea',
  'dizzy',
  'breastTender',
  'acne',
  'cravings',
  'insomnia',
  'sleepy',
  'moodSwings',
  'fever',
];
const PAIN_AREAS = ['abdomen', 'back', 'head', 'breasts', 'pelvis', 'legs'];
const FLOWS: FlowLevel[] = ['light', 'medium', 'heavy'];

const ICONS: Record<Field, ReactNode> = {
  flow: <DropIcon />,
  weight: '⚖️',
  water: '🥤',
  health: '🩺',
  pain: '😣',
  mood: '🥰',
  note: '📝',
};

function summary(field: Field, e: MoodEntry | undefined, t: Dict): string | null {
  if (!e) return null;
  switch (field) {
    case 'flow':
      return e.flow ? t.flowLevels[e.flow] : null;
    case 'weight':
      return e.weight != null ? `${e.weight} ${t.kg}` : null;
    case 'water':
      return e.water != null ? t.glasses(e.water) : null;
    case 'health':
      return e.symptoms.length ? e.symptoms.map((s) => t.symptomList[s] ?? s).join('، ') : null;
    case 'pain':
      return e.painLevel != null || e.painAreas?.length
        ? [e.painLevel != null ? `${e.painLevel}/10` : '', ...(e.painAreas ?? []).map((a) => t.painAreas[a] ?? a)].filter(Boolean).join(' · ')
        : null;
    case 'mood':
      return e.mood ? `${MOOD_EMOJI[e.mood]} ${t.moods[e.mood]}` : null;
    case 'note':
      return e.note?.trim() ? e.note : null;
  }
}

/** Editable daily health rows for one date (mirrors the reference "health notes" list). */
export function HealthLog({ date }: { date: ISODate }) {
  const { t, moods, saveMood, showToast } = useStore();
  const [editing, setEditing] = useState<Field | null>(null);
  const entry = moods.find((m) => m.date === date);

  async function save(patch: Partial<MoodEntry>) {
    await saveMood({ ...(entry ?? { symptoms: [] }), ...patch, date });
    showToast(t.saved);
    setEditing(null);
  }

  const rows: { field: Field; label: string }[] = [
    { field: 'flow', label: t.flowLabel },
    { field: 'weight', label: t.weightLabel },
    { field: 'water', label: t.waterLabel },
    { field: 'health', label: t.healthLabel },
    { field: 'pain', label: t.painLabel },
    { field: 'mood', label: t.moodLabel },
    { field: 'note', label: t.notesLabel },
  ];

  return (
    <>
      <ul className="divide-y divide-ink/5">
        {rows.map(({ field, label }) => {
          const value = summary(field, entry, t);
          return (
            <li key={field}>
              <button className="flex w-full items-center gap-3 py-3.5 text-start active:bg-blush-50/60" onClick={() => setEditing(field)}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ffe9f0] text-2xl text-[#ff5d8f]">{ICONS[field]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-semibold text-[#2f2329]">{label}</span>
                  {value && <span className="block truncate text-xs text-[#ff5d8f]">{value}</span>}
                </span>
                <span
                  className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold ${
                    value ? 'bg-[#ff5d8f] text-white' : 'border-[1.5px] border-[#ff5d8f] text-[#ff5d8f]'
                  }`}
                >
                  {value ? t.edit : t.record}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {editing && (
        <Editor key={`${date}-${editing}`} field={editing} entry={entry} title={rows.find((r) => r.field === editing)!.label} onSave={save} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function Editor({
  field,
  entry,
  title,
  onSave,
  onClose,
}: {
  field: Field;
  entry?: MoodEntry;
  title: string;
  onSave: (p: Partial<MoodEntry>) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useStore();
  const [flow, setFlow] = useState<FlowLevel | undefined>(entry?.flow);
  const [weight, setWeight] = useState(entry?.weight != null ? String(entry.weight) : '');
  const [water, setWater] = useState(entry?.water ?? 0);
  const [symptoms, setSymptoms] = useState<string[]>(entry?.symptoms ?? []);
  const [pain, setPain] = useState<number | undefined>(entry?.painLevel);
  const [areas, setAreas] = useState<string[]>(entry?.painAreas ?? []);
  const [mood, setMood] = useState(entry?.mood);
  const [note, setNote] = useState(entry?.note ?? '');

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const chip = (on: boolean) =>
    `rounded-full px-3.5 py-2 text-sm font-semibold transition-all ${on ? 'bg-[#ff5d8f] text-white shadow' : 'bg-white text-ink ring-1 ring-blush-100'}`;

  const parsedWeight = Number(weight.replace(',', '.').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
  const weightOk = weight === '' || (Number.isFinite(parsedWeight) && parsedWeight >= 20 && parsedWeight <= 300);

  const patch = (): Partial<MoodEntry> => {
    switch (field) {
      case 'flow':
        return { flow };
      case 'weight':
        return { weight: weight === '' ? undefined : Math.round(parsedWeight * 10) / 10 };
      case 'water':
        return { water };
      case 'health':
        return { symptoms };
      case 'pain':
        return { painLevel: pain, painAreas: areas.length ? areas : undefined };
      case 'mood':
        return { mood };
      case 'note':
        return { note: note.trim() ? note : undefined };
    }
  };
  const removal: Partial<MoodEntry> = {
    flow: { flow: undefined },
    weight: { weight: undefined },
    water: { water: undefined },
    health: { symptoms: [] },
    pain: { painLevel: undefined, painAreas: undefined },
    mood: { mood: undefined },
    note: { note: undefined },
  }[field];
  const hasValue = !!entry && summary(field, entry, t) !== null;

  return (
    <Sheet open onClose={onClose} title={title}>
      <div className="space-y-4 pb-5">
        {field === 'flow' && (
          <div className="grid grid-cols-3 gap-2">
            {FLOWS.map((f, i) => (
              <button
                key={f}
                aria-pressed={flow === f}
                onClick={() => setFlow(flow === f ? undefined : f)}
                className={`flex flex-col items-center gap-1 rounded-3xl py-4 font-bold transition-all ${
                  flow === f ? 'bg-[#ff5d8f] text-white shadow-md' : 'bg-white text-ink ring-1 ring-blush-100'
                }`}
              >
                <span className="flex gap-0.5">
                  {Array.from({ length: i + 1 }, (_, k) => (
                    <DropIcon key={k} small />
                  ))}
                </span>
                {t.flowLevels[f]}
              </button>
            ))}
          </div>
        )}

        {field === 'weight' && (
          <label className="block">
            <div className="flex items-center gap-2 rounded-2xl border border-blush-200 bg-white px-4" dir="ltr">
              <input
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value.slice(0, 6))}
                placeholder="55.5"
                className="w-full bg-transparent py-3 text-2xl font-bold outline-none"
                aria-label={title}
              />
              <span className="text-ink/60">{t.kg}</span>
            </div>
          </label>
        )}

        {field === 'water' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-4" dir="ltr">
              <button className="btn btn-soft h-12 w-12 !p-0 text-2xl" onClick={() => setWater(Math.max(0, water - 1))} aria-label="-">
                −
              </button>
              <span className="w-28 text-center text-3xl font-black text-[#ff5d8f] tabular-nums">{water}</span>
              <button className="btn btn-soft h-12 w-12 !p-0 text-2xl" onClick={() => setWater(Math.min(30, water + 1))} aria-label="+">
                +
              </button>
            </div>
            <p className="text-sm text-ink/70">{t.glasses(water)}</p>
            <div className="flex flex-wrap justify-center gap-1 text-xl" aria-hidden="true">
              {Array.from({ length: Math.min(water, 12) }, (_, i) => (
                <span key={i}>💧</span>
              ))}
            </div>
          </div>
        )}

        {field === 'health' && (
          <div className="flex flex-wrap gap-2">
            {HEALTH_SYMPTOMS.map((s) => (
              <button key={s} aria-pressed={symptoms.includes(s)} className={chip(symptoms.includes(s))} onClick={() => setSymptoms(toggle(symptoms, s))}>
                {t.symptomList[s] ?? s}
              </button>
            ))}
          </div>
        )}

        {field === 'pain' && (
          <>
            <div>
              <p className="mb-2 text-sm font-bold text-lav-500">
                {t.painLevelLabel} {pain != null && <span className="text-[#ff5d8f]">· {pain}/10</span>}
              </p>
              <div className="grid grid-cols-10 gap-1" dir="ltr">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    aria-pressed={pain === n}
                    onClick={() => setPain(pain === n ? undefined : n)}
                    className={`h-10 rounded-xl text-sm font-bold transition-all ${
                      pain != null && n <= pain ? 'text-white' : 'bg-white text-ink/60 ring-1 ring-blush-100'
                    }`}
                    style={pain != null && n <= pain ? { background: `hsl(${340 - n * 4} 90% ${72 - n * 2.5}%)` } : undefined}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-lav-500">{t.painWhere}</p>
              <div className="flex flex-wrap gap-2">
                {PAIN_AREAS.map((a) => (
                  <button key={a} aria-pressed={areas.includes(a)} className={chip(areas.includes(a))} onClick={() => setAreas(toggle(areas, a))}>
                    {t.painAreas[a]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {field === 'mood' && (
          <div className="grid grid-cols-2 gap-2">
            {MOOD_IDS.map((id) => (
              <button
                key={id}
                aria-pressed={mood === id}
                onClick={() => setMood(mood === id ? undefined : id)}
                className={`flex items-center gap-2 rounded-3xl px-3 py-3 text-start font-bold transition-all ${
                  mood === id ? 'bg-gradient-to-br from-blush-200 to-lav-200 shadow-md ring-2 ring-blush-300' : 'bg-white ring-1 ring-blush-100'
                }`}
              >
                <span className="text-2xl">{MOOD_EMOJI[id]}</span>
                <span className="text-sm">{t.moods[id]}</span>
              </button>
            ))}
          </div>
        )}

        {field === 'note' && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder={t.notePlaceholder}
            className="w-full resize-none rounded-2xl border border-blush-200 bg-white px-4 py-3"
          />
        )}

        <div className="grid grid-cols-2 gap-2">
          <button className="btn bg-[#ff5d8f] text-white" disabled={!weightOk} onClick={() => onSave(patch())}>
            {t.save}
          </button>
          <button className="btn btn-soft" onClick={onClose}>
            {t.cancel}
          </button>
        </div>
        {hasValue && (
          <button className="btn w-full bg-red-50 text-sm text-red-600" onClick={() => onSave(removal)}>
            🗑 {t.removeRecord}
          </button>
        )}
      </div>
    </Sheet>
  );
}

function DropIcon({ small = false }: { small?: boolean }) {
  const s = small ? 16 : 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5C9 7 5.5 10.6 5.5 14.6a6.5 6.5 0 0 0 13 0C18.5 10.6 15 7 12 2.5z" fill="currentColor" />
      <path d="M9 15.5a3 3 0 0 0 3 3" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}
