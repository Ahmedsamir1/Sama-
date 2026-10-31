import { useEffect, useState } from 'react';
import { FloatingHearts } from './components/Effects';
import { Sheet, Toast } from './components/UI';
import { Bunny } from './components/Bunny';
import { useStore } from './lib/store';
import { Home } from './pages/Home';
import { Period } from './pages/Period';
import { Mood } from './pages/Mood';
import { Ahmed } from './pages/Ahmed';
import { Kit } from './pages/Kit';
import { PrivacyCard, Settings } from './pages/Settings';
import type { Tab } from './pages/types';

const TABS: { id: Tab; icon: string; label: 'navHome' | 'navPeriod' | 'navMood' | 'navAhmed' | 'navKit' }[] = [
  { id: 'home', icon: '🏠', label: 'navHome' },
  { id: 'period', icon: '🌙', label: 'navPeriod' },
  { id: 'mood', icon: '🥰', label: 'navMood' },
  { id: 'ahmed', icon: '💌', label: 'navAhmed' },
  { id: 'kit', icon: '🚨', label: 'navKit' },
];

const isTab = (s: string): s is Tab => TABS.some((x) => x.id === s);

export default function App() {
  const { ready, error, t, settings, updateSettings } = useStore();
  const [tab, setTab] = useState<Tab>(() => {
    const h = location.hash.slice(1);
    return isTab(h) ? h : 'home';
  });
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    history.replaceState(null, '', `#${tab}`);
    window.scrollTo({ top: 0 });
  }, [tab]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Bunny size={120} className="animate-bob" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <FloatingHearts />
      <Toast />

      <header className="pt-safe sticky top-0 z-30 flex items-center justify-between bg-gradient-to-b from-cream-50/95 to-cream-50/0 px-5 pb-3">
        <span className="text-sm font-extrabold tracking-wide text-blush-500">{t.appName}</span>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-xl shadow-sm ring-1 ring-blush-100"
          onClick={() => setShowSettings(true)}
          aria-label={t.settings}
        >
          ⚙️
        </button>
      </header>

      <main className="flex-1 px-4 pb-32">
        {error && <p className="card mb-4 p-4 text-sm text-red-600">⚠️ {error}</p>}
        {showSettings ? (
          <Settings onClose={() => setShowSettings(false)} />
        ) : (
          <div key={tab} className="animate-pop">
            {tab === 'home' && <Home go={setTab} />}
            {tab === 'period' && <Period />}
            {tab === 'mood' && <Mood />}
            {tab === 'ahmed' && <Ahmed />}
            {tab === 'kit' && <Kit />}
          </div>
        )}
      </main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg px-3">
        <div className="card mb-1 grid grid-cols-5 gap-1 !rounded-[1.6rem] p-1.5">
          {TABS.map((x) => {
            const active = !showSettings && tab === x.id;
            return (
              <button
                key={x.id}
                onClick={() => {
                  setShowSettings(false);
                  setTab(x.id);
                }}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-bold transition-all ${
                  active ? 'bg-gradient-to-b from-blush-100 to-lav-100 text-blush-600' : 'text-ink/60'
                }`}
              >
                <span className={`text-xl transition-transform ${active ? 'scale-115' : ''}`}>{x.icon}</span>
                {t[x.label]}
              </button>
            );
          })}
        </div>
      </nav>

      <Sheet open={!settings.privacyAcknowledged} onClose={() => updateSettings({ privacyAcknowledged: true })}>
        <div className="flex flex-col items-center pb-4">
          <Bunny size={100} holding="heart" className="animate-bob" />
          <h2 className="my-2 text-center text-xl font-extrabold text-blush-600">{t.greetingMorning}</h2>
          <PrivacyCard onAcknowledge={() => updateSettings({ privacyAcknowledged: true })} />
        </div>
      </Sheet>
    </div>
  );
}
