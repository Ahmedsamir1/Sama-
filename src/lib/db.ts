/**
 * Minimal IndexedDB wrapper. Everything stays on this device — there is no server.
 */
import type { PeriodRecord, CycleSettings } from './cycle';
import { DEFAULT_CYCLE } from './cycle';
import type { ISODate } from './dates';

export type MoodId = 'happy' | 'hug' | 'chocolate' | 'sad' | 'leaveMe' | 'queen';

export interface MoodEntry {
  date: ISODate;
  mood?: MoodId;
  symptoms: string[];
  note?: string;
}

export type Language = 'ar' | 'en';

export interface AppSettings extends CycleSettings {
  language: Language;
  /** Ahmed's WhatsApp number in international format, digits only (e.g. 2010xxxxxxx). */
  whatsappNumber: string;
  hugCount: number;
  chocolateCount: number;
  privacyAcknowledged: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  ...DEFAULT_CYCLE,
  language: 'ar',
  whatsappNumber: '',
  hugCount: 0,
  chocolateCount: 0,
  privacyAcknowledged: false,
};

const DB_NAME = 'sama-little-universe';
const DB_VERSION = 1;
const SETTINGS_KEY = 'app';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('periods')) db.createObjectStore('periods', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('moods')) db.createObjectStore('moods', { keyPath: 'date' });
      if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

type StoreName = 'periods' | 'moods' | 'settings';

async function tx<T>(store: StoreName, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    let result: T;
    if (req) req.onsuccess = () => (result = req.result);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const db = {
  getPeriods: () => tx<PeriodRecord[]>('periods', 'readonly', (s) => s.getAll()),
  putPeriod: (p: PeriodRecord) => tx('periods', 'readwrite', (s) => s.put(p)).then(() => undefined),
  deletePeriod: (id: string) => tx('periods', 'readwrite', (s) => s.delete(id)).then(() => undefined),

  getMoods: () => tx<MoodEntry[]>('moods', 'readonly', (s) => s.getAll()),
  putMood: (m: MoodEntry) => tx('moods', 'readwrite', (s) => s.put(m)).then(() => undefined),
  deleteMood: (date: ISODate) => tx('moods', 'readwrite', (s) => s.delete(date)).then(() => undefined),

  async getSettings(): Promise<AppSettings> {
    const saved = await tx<Partial<AppSettings> | undefined>('settings', 'readonly', (s) => s.get(SETTINGS_KEY));
    return { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
  },
  putSettings: (s: AppSettings) => tx('settings', 'readwrite', (st) => st.put(s, SETTINGS_KEY)).then(() => undefined),

  async replaceAll(data: { periods: PeriodRecord[]; moods: MoodEntry[]; settings: AppSettings }): Promise<void> {
    const d = await openDB();
    await new Promise<void>((resolve, reject) => {
      const t = d.transaction(['periods', 'moods', 'settings'], 'readwrite');
      const ps = t.objectStore('periods');
      const ms = t.objectStore('moods');
      ps.clear();
      ms.clear();
      data.periods.forEach((p) => ps.put(p));
      data.moods.forEach((m) => ms.put(m));
      t.objectStore('settings').put(data.settings, SETTINGS_KEY);
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  },

  async clearAll(): Promise<void> {
    const d = await openDB();
    await new Promise<void>((resolve, reject) => {
      const t = d.transaction(['periods', 'moods', 'settings'], 'readwrite');
      t.objectStore('periods').clear();
      t.objectStore('moods').clear();
      t.objectStore('settings').clear();
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  },
};

/** Ask the browser not to evict our data under storage pressure (best effort). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* ignore */
  }
  return false;
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
