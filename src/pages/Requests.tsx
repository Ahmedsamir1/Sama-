import { useState } from 'react';
import { Bunny } from '../components/Bunny';
import { useBurst } from '../components/Effects';
import { PageTitle } from '../components/UI';
import { LOVE_REQUESTS, randomRequestMessage, type RequestId } from '../data/requests';
import { whatsappLink } from '../lib/backup';
import { useStore } from '../lib/store';

export function Requests() {
  const { t, settings, showToast } = useStore();
  const lang = settings.language;
  const [burstLayer, burst] = useBurst();
  // One prepared draft per request; reshuffled after each use.
  const [drafts, setDrafts] = useState<Record<RequestId, string>>(
    () => Object.fromEntries(LOVE_REQUESTS.map((r) => [r.id, randomRequestMessage(r)])) as Record<RequestId, string>,
  );

  return (
    <div className="space-y-4">
      {burstLayer}
      <PageTitle title={t.requestsTitle} subtitle={t.requestsSubtitle} />

      <section className="card relative flex items-center gap-3 overflow-hidden p-4">
        <div className="absolute -start-8 -bottom-8 h-28 w-28 rounded-full bg-lav-200/60 blur-2xl" />
        <Bunny size={72} holding="heart" mood="wink" className="animate-bob shrink-0" />
        <p className="text-sm leading-relaxed font-semibold">{t.requestsIntro}</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {LOVE_REQUESTS.map((r, i) => (
          <a
            key={r.id}
            href={whatsappLink(settings.whatsappNumber, drafts[r.id])}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              burst(e.clientX, e.clientY, [r.emoji, '💖', '💕', '✨'], 14);
              if (navigator.vibrate) navigator.vibrate(25);
              showToast(t.requestOpening);
              // Prepare a fresh variant for next time (after the link has been followed).
              window.setTimeout(() => setDrafts((d) => ({ ...d, [r.id]: randomRequestMessage(r, d[r.id]) })), 400);
            }}
            className={`card animate-pop flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${r.tint} p-5 text-center transition-transform active:scale-95`}
            style={{ animationDelay: `${i * 50}ms` }}
            aria-label={`${r.label[lang]} — ${t.whatsappAhmed}`}
          >
            <span className="text-5xl drop-shadow-sm">{r.emoji}</span>
            <span className="text-base font-extrabold text-ink">{r.label[lang]}</span>
          </a>
        ))}
      </section>

      <p className="rounded-2xl bg-lav-100/80 p-3 text-center text-xs leading-relaxed text-ink/80">💬 {t.requestsHint}</p>
    </div>
  );
}
