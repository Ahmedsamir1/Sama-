import { useState } from 'react';
import { Bunny } from '../components/Bunny';
import { useBurst } from '../components/Effects';
import { PageTitle } from '../components/UI';
import { AHMED_MESSAGES } from '../data/messages';
import { whatsappLink } from '../lib/backup';
import { useStore } from '../lib/store';

export function Ahmed() {
  const { t, settings, updateSettings, showToast } = useStore();
  const [burstLayer, burst] = useBurst();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * AHMED_MESSAGES.length));
  const [hugging, setHugging] = useState(false);
  const [waText, setWaText] = useState(t.waDefault);

  const next = (e: React.MouseEvent) => {
    setIndex((i) => {
      let n = Math.floor(Math.random() * AHMED_MESSAGES.length);
      if (n === i) n = (n + 1) % AHMED_MESSAGES.length;
      return n;
    });
    burst(e.clientX, e.clientY, ['💌', '💗', '💕'], 10);
  };

  const hug = async () => {
    setHugging(true);
    burst(window.innerWidth / 2, window.innerHeight / 2.5, ['🤗', '💞', '🧸', '💗', '💖'], 26);
    if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
    showToast(t.hugReceived);
    await updateSettings({ hugCount: settings.hugCount + 1 });
    window.setTimeout(() => setHugging(false), 950);
  };

  return (
    <div className="space-y-4">
      {burstLayer}
      <PageTitle title={t.ahmedTitle} subtitle={t.ahmedSubtitle} />

      <section className="card relative overflow-hidden p-6 text-center">
        <span className="animate-heartbeat absolute end-4 top-3 text-2xl">💗</span>
        <span className="animate-heartbeat absolute start-5 bottom-4 text-lg" style={{ animationDelay: '0.5s' }}>
          💕
        </span>
        <p className="mb-1 text-xs font-bold text-lav-500" dir="ltr">{t.messageCounter(index + 1, AHMED_MESSAGES.length)}</p>
        <p key={index} className="animate-pop min-h-[6rem] py-3 text-xl leading-relaxed font-extrabold" dir="rtl" lang="ar">
          {AHMED_MESSAGES[index]}
        </p>
        <p className="text-sm font-bold text-blush-500">— {settings.language === 'ar' ? 'أحمد' : 'Ahmed'} ❤️</p>
        <button className="btn btn-primary mt-4" onClick={next}>
          {t.anotherMessage}
        </button>
      </section>

      <section className="card flex flex-col items-center p-6 text-center">
        <button onClick={hug} className={hugging ? 'animate-hug' : 'animate-bob'} aria-label={t.sendHug}>
          <Bunny size={140} holding="heart" mood={hugging ? 'wink' : 'happy'} />
        </button>
        <button className="btn btn-primary mt-2 w-full" onClick={hug}>
          {t.sendHug}
        </button>
        <p className="mt-2 text-xs text-ink/60">{t.hugsCount(settings.hugCount)}</p>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 font-extrabold text-blush-600">💬 {t.whatsappAhmed}</h2>
        <p className="mb-3 text-xs text-ink/60">{t.whatsappHint}</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {t.waOptions.map((o) => (
            <button
              key={o}
              onClick={() => setWaText(o)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${waText === o ? 'bg-blush-400 text-white' : 'bg-blush-50'}`}
            >
              {o}
            </button>
          ))}
        </div>
        <textarea
          value={waText}
          onChange={(e) => setWaText(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full resize-none rounded-2xl border border-blush-200 bg-white px-4 py-3"
        />
        <a
          className="btn mt-2 w-full bg-[#25D366] text-white shadow-md"
          href={whatsappLink(settings.whatsappNumber, waText)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.whatsappAhmed}
        </a>
      </section>
    </div>
  );
}
