import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { PeriodRecord } from './cycle';
import { db, DEFAULT_SETTINGS, requestPersistentStorage, type AppSettings, type MoodEntry } from './db';
import { DICTS, type Dict } from './i18n';
import { todayISO } from './dates';

interface Store {
  ready: boolean;
  error: string | null;
  periods: PeriodRecord[];
  moods: MoodEntry[];
  settings: AppSettings;
  t: Dict;
  today: string;
  savePeriod(p: PeriodRecord): Promise<void>;
  deletePeriod(id: string): Promise<void>;
  saveMood(m: MoodEntry): Promise<void>;
  updateSettings(patch: Partial<AppSettings>): Promise<void>;
  reload(): Promise<void>;
  toast: string | null;
  showToast(msg: string): void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<PeriodRecord[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [toast, setToast] = useState<string | null>(null);
  const [today, setToday] = useState(todayISO());

  const reload = useCallback(async () => {
    try {
      const [p, m, s] = await Promise.all([db.getPeriods(), db.getMoods(), db.getSettings()]);
      setPeriods(p);
      setMoods(m);
      setSettings(s);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(String(e));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    reload();
    requestPersistentStorage();
    // Keep "today" fresh when the app is resumed the next day.
    const onVisible = () => document.visibilityState === 'visible' && setToday(todayISO());
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(() => setToday(todayISO()), 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [reload]);

  useEffect(() => {
    const lang = settings.language;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [settings.language]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2600);
  }, []);

  const store = useMemo<Store>(
    () => ({
      ready,
      error,
      periods,
      moods,
      settings,
      today,
      t: DICTS[settings.language],
      toast,
      showToast,
      reload,
      async savePeriod(p) {
        await db.putPeriod(p);
        setPeriods((prev) => [...prev.filter((x) => x.id !== p.id), p]);
      },
      async deletePeriod(id) {
        await db.deletePeriod(id);
        setPeriods((prev) => prev.filter((x) => x.id !== id));
      },
      async saveMood(m) {
        const empty = !m.mood && m.symptoms.length === 0 && !m.note?.trim();
        if (empty) await db.deleteMood(m.date);
        else await db.putMood(m);
        setMoods((prev) => [...prev.filter((x) => x.date !== m.date), ...(empty ? [] : [m])]);
      },
      async updateSettings(patch) {
        const next = { ...settings, ...patch };
        setSettings(next);
        await db.putSettings(next);
      },
    }),
    [ready, error, periods, moods, settings, today, toast, showToast, reload],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
