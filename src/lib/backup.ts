import type { PeriodRecord } from './cycle';
import { isValidISO } from './dates';
import { AHMED_WHATSAPP } from '../config';
import { DEFAULT_SETTINGS, type AppSettings, type FlowLevel, type MoodEntry, type MoodId } from './db';

export const BACKUP_FORMAT = 'sama-little-universe-backup';
export const MOOD_IDS: MoodId[] = ['happy', 'hug', 'chocolate', 'sad', 'leaveMe', 'queen'];
export const FLOW_LEVELS: FlowLevel[] = ['light', 'medium', 'heavy'];
/** Version 2 adds optional daily health fields to mood entries; version 1 files still import. */
export const BACKUP_VERSION = 2;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  periods: PeriodRecord[];
  moods: MoodEntry[];
  settings: AppSettings;
}

export function createBackup(periods: PeriodRecord[], moods: MoodEntry[], settings: AppSettings, now = new Date()): BackupFile {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), periods, moods, settings };
}

const clampInt = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;

/** Validates and sanitises an imported backup. Throws on invalid input. */
export function parseBackup(text: string): BackupFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('invalid-json');
  }
  if (!raw || typeof raw !== 'object') throw new Error('invalid-format');
  const r = raw as Record<string, unknown>;
  if (r.format !== BACKUP_FORMAT || !Array.isArray(r.periods) || !Array.isArray(r.moods)) throw new Error('invalid-format');

  const periods: PeriodRecord[] = [];
  for (const p of r.periods as Record<string, unknown>[]) {
    if (!p || typeof p.id !== 'string' || !isValidISO(p.start)) continue;
    const rec: PeriodRecord = { id: p.id, start: p.start };
    if (isValidISO(p.end) && p.end >= p.start) rec.end = p.end;
    periods.push(rec);
  }

  const moods: MoodEntry[] = [];
  for (const m of r.moods as Record<string, unknown>[]) {
    if (!m || !isValidISO(m.date)) continue;
    const entry: MoodEntry = {
      date: m.date,
      symptoms: Array.isArray(m.symptoms) ? m.symptoms.filter((s): s is string => typeof s === 'string').slice(0, 20) : [],
    };
    if (typeof m.mood === 'string' && (MOOD_IDS as string[]).includes(m.mood)) entry.mood = m.mood as MoodId;
    if (typeof m.note === 'string') entry.note = m.note.slice(0, 1000);
    if (typeof m.flow === 'string' && (FLOW_LEVELS as string[]).includes(m.flow)) entry.flow = m.flow as FlowLevel;
    if (typeof m.weight === 'number' && m.weight >= 20 && m.weight <= 300) entry.weight = Math.round(m.weight * 10) / 10;
    if (typeof m.water === 'number' && m.water >= 0 && m.water <= 30) entry.water = Math.round(m.water);
    if (typeof m.painLevel === 'number' && m.painLevel >= 1 && m.painLevel <= 10) entry.painLevel = Math.round(m.painLevel);
    if (Array.isArray(m.painAreas)) {
      const areas = m.painAreas.filter((s): s is string => typeof s === 'string').slice(0, 20);
      if (areas.length) entry.painAreas = areas;
    }
    moods.push(entry);
  }

  const s = (r.settings && typeof r.settings === 'object' ? r.settings : {}) as Record<string, unknown>;
  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    cycleLength: clampInt(s.cycleLength, 15, 60, DEFAULT_SETTINGS.cycleLength),
    periodLength: clampInt(s.periodLength, 1, 14, DEFAULT_SETTINGS.periodLength),
    autoAverage: typeof s.autoAverage === 'boolean' ? s.autoAverage : DEFAULT_SETTINGS.autoAverage,
    language: s.language === 'en' ? 'en' : 'ar',
    whatsappNumber: typeof s.whatsappNumber === 'string' ? s.whatsappNumber.replace(/\D/g, '').slice(0, 20) : '',
    hugCount: clampInt(s.hugCount, 0, 1e9, 0),
    chocolateCount: clampInt(s.chocolateCount, 0, 1e9, 0),
    privacyAcknowledged: s.privacyAcknowledged === true,
  };

  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: typeof r.exportedAt === 'string' ? r.exportedAt : '', periods, moods, settings };
}

/**
 * Builds a wa.me link that opens WhatsApp (iPhone & Android) with a prefilled draft.
 * It never sends anything — Sama presses Send herself.
 * Falls back to Ahmed's number when no custom number is set.
 */
export function whatsappLink(number: string, text: string): string {
  const digits = number.replace(/\D/g, '') || AHMED_WHATSAPP;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
