import { useCallback, useEffect, useState } from 'react';
import { Bunny } from '../components/Bunny';
import { Rain, useBurst } from '../components/Effects';
import { PageTitle } from '../components/UI';
import { COMPLIMENTS, SUPPORT_MESSAGES, SURPRISES, type Bilingual } from '../data/kit';
import { whatsappLink } from '../lib/backup';
import { useStore } from '../lib/store';

const CHOCO = ['🍫', '🍬', '🍩', '🧁', '🍪', '💗'];
const pick = (list: Bilingual[], not?: Bilingual) => {
  let x = list[Math.floor(Math.random() * list.length)];
  if (x === not && list.length > 1) x = list[(list.indexOf(x) + 1) % list.length];
  return x;
};

export function Kit() {
  const { t, settings, updateSettings, showToast } = useStore();
  const lang = settings.language;
  const [burstLayer, burst] = useBurst();
  const [raining, setRaining] = useState(false);
  const [card, setCard] = useState<{ kind: 'support' | 'surprise' | 'compliment'; item: Bilingual } | null>(null);
  const [boxOpen, setBoxOpen] = useState(false);
  const [breathing, setBreathing] = useState(false);

  const stopRain = useCallback(() => setRaining(false), []);

  const chocolate = async () => {
    setRaining(true);
    if (navigator.vibrate) navigator.vibrate([60, 30, 60]);
    showToast(t.chocolateDone);
    await updateSettings({ chocolateCount: settings.chocolateCount + 1 });
  };

  const show = (kind: 'support' | 'surprise' | 'compliment', e: React.MouseEvent) => {
    const list = kind === 'support' ? SUPPORT_MESSAGES : kind === 'surprise' ? SURPRISES : COMPLIMENTS;
    setCard({ kind, item: pick(list, card?.item) });
    if (kind === 'surprise') setBoxOpen(false);
    else burst(e.clientX, e.clientY, kind === 'compliment' ? ['💖', '🌟', '👑', '✨'] : ['💬', '💗', '🌸'], 14);
  };

  return (
    <div className="space-y-4">
      {burstLayer}
      <Rain emojis={CHOCO} active={raining} onDone={stopRain} />
      <PageTitle title={t.kitTitle} subtitle={t.kitSubtitle} />

      <section className="card flex flex-col items-center p-6 text-center">
        <Bunny size={110} holding="chocolate" mood="wink" className="animate-bob" />
        <button
          onClick={chocolate}
          className="mt-3 flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-[#a0603f] to-[#5c3424] text-white shadow-[0_12px_30px_-8px_rgba(92,52,36,0.8),inset_0_-8px_0_rgba(0,0,0,0.2)] ring-8 ring-blush-200 transition-transform active:scale-90"
        >
          <span className="px-3 text-sm leading-tight font-extrabold">
            <span className="block text-4xl">🍫</span>
            {t.chocolateButton}
          </span>
        </button>
        <p className="mt-3 text-xs text-ink/60">{t.chocolateCount(settings.chocolateCount)}</p>
        <a
          className="btn btn-soft mt-3 w-full text-sm"
          href={whatsappLink(settings.whatsappNumber, t.waChocolate)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.orderChocolate}
        </a>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <KitButton emoji="💬" label={t.supportButton} onClick={(e) => show('support', e)} />
        <KitButton emoji="🎁" label={t.surpriseButton} onClick={(e) => show('surprise', e)} />
        <KitButton emoji="💖" label={t.complimentButton} onClick={(e) => show('compliment', e)} />
        <KitButton emoji="🐰" label={t.breatheButton} onClick={() => setBreathing(true)} />
      </section>

      {card && (
        <section key={card.item.ar} className="card animate-pop p-6 text-center">
          {card.kind === 'surprise' && !boxOpen ? (
            <button
              className="mx-auto flex flex-col items-center"
              onClick={(e) => {
                setBoxOpen(true);
                burst(e.clientX, e.clientY, ['🎉', '🎊', '💝', '✨', '🎀'], 24);
              }}
            >
              <span className="animate-wiggle text-7xl">🎁</span>
              <span className="mt-2 text-sm font-bold text-lav-500">{t.tapToOpen}</span>
            </button>
          ) : (
            <p className="animate-pop text-lg leading-relaxed font-extrabold">{card.item[lang]}</p>
          )}
        </section>
      )}

      {breathing && <Breathe onStop={() => setBreathing(false)} />}
    </div>
  );
}

function KitButton({ emoji, label, onClick }: { emoji: string; label: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button onClick={onClick} className="card flex flex-col items-center gap-2 p-4 transition-transform active:scale-95">
      <span className="text-4xl">{emoji}</span>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

const PHASES = [
  { key: 'breatheIn', ms: 4000, scale: 1.35 },
  { key: 'breatheHold', ms: 2000, scale: 1.35 },
  { key: 'breatheOut', ms: 5000, scale: 0.9 },
] as const;

function Breathe({ onStop }: { onStop: () => void }) {
  const { t } = useStore();
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timer = window.setTimeout(() => setPhase((p) => (p + 1) % PHASES.length), PHASES[phase].ms);
    return () => window.clearTimeout(timer);
  }, [phase]);
  const p = PHASES[phase];
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-b from-lav-100/95 to-blush-100/95 backdrop-blur" role="dialog" aria-modal="true">
      <div
        className="flex h-56 w-56 items-center justify-center rounded-full bg-white/70 shadow-2xl"
        style={{ transform: `scale(${p.scale})`, transition: `transform ${p.ms}ms ease-in-out` }}
      >
        <Bunny size={150} holding="heart" mood={p.key === 'breatheOut' ? 'sleepy' : 'happy'} />
      </div>
      <p className="mt-16 text-3xl font-extrabold text-blush-600" aria-live="polite">
        {t[p.key]}
      </p>
      <button className="btn btn-soft mt-10" onClick={onStop}>
        {t.breatheStop}
      </button>
    </div>
  );
}
