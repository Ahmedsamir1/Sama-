import { describe, expect, it } from 'vitest';
import { createBackup, parseBackup, whatsappLink } from './backup';
import { DEFAULT_SETTINGS } from './db';

describe('backup', () => {
  it('round-trips data', () => {
    const b = createBackup(
      [{ id: '1', start: '2026-09-01', end: '2026-09-05' }],
      [{ date: '2026-09-02', mood: 'queen', symptoms: ['cramps'], note: 'hi' }],
      { ...DEFAULT_SETTINGS, cycleLength: 30, language: 'en' },
    );
    const parsed = parseBackup(JSON.stringify(b));
    expect(parsed.periods).toEqual(b.periods);
    expect(parsed.moods).toEqual(b.moods);
    expect(parsed.settings.cycleLength).toBe(30);
    expect(parsed.settings.language).toBe('en');
  });

  it('rejects non-backups', () => {
    expect(() => parseBackup('nope')).toThrow('invalid-json');
    expect(() => parseBackup('{"a":1}')).toThrow('invalid-format');
  });

  it('sanitises bad entries', () => {
    const parsed = parseBackup(
      JSON.stringify({
        format: 'sama-little-universe-backup',
        periods: [{ id: '1', start: 'bad' }, { id: '2', start: '2026-09-10', end: '2026-09-01' }, null],
        moods: [{ date: '2026-09-01', mood: 'evil', symptoms: [1, 'tired'] }],
        settings: { cycleLength: 999, whatsappNumber: '+20 100-123', language: 'xx' },
      }),
    );
    expect(parsed.periods).toEqual([{ id: '2', start: '2026-09-10' }]);
    expect(parsed.moods).toEqual([{ date: '2026-09-01', symptoms: ['tired'] }]);
    expect(parsed.settings.cycleLength).toBe(60);
    expect(parsed.settings.whatsappNumber).toBe('20100123');
    expect(parsed.settings.language).toBe('ar');
  });
});

describe('backup v2 health fields', () => {
  it('round-trips daily health records', () => {
    const mood = { date: '2026-11-02', symptoms: ['nausea'], flow: 'heavy' as const, weight: 58.4, water: 6, painLevel: 7, painAreas: ['abdomen'], note: 'ok' };
    const b = createBackup([], [mood], DEFAULT_SETTINGS);
    expect(b.version).toBe(2);
    expect(parseBackup(JSON.stringify(b)).moods).toEqual([mood]);
  });

  it('still imports version 1 backups unchanged', () => {
    const v1 = { format: 'sama-little-universe-backup', version: 1, exportedAt: 'x', periods: [{ id: '1', start: '2026-09-01' }], moods: [{ date: '2026-09-02', mood: 'happy', symptoms: [] }], settings: {} };
    const parsed = parseBackup(JSON.stringify(v1));
    expect(parsed.periods).toHaveLength(1);
    expect(parsed.moods).toEqual([{ date: '2026-09-02', mood: 'happy', symptoms: [] }]);
  });

  it('drops invalid health values', () => {
    const parsed = parseBackup(
      JSON.stringify({ format: 'sama-little-universe-backup', periods: [], moods: [{ date: '2026-09-02', symptoms: [], flow: 'huge', weight: 5, water: -1, painLevel: 42, painAreas: [3] }] }),
    );
    expect(parsed.moods).toEqual([{ date: '2026-09-02', symptoms: [] }]);
  });
});

describe('whatsappLink', () => {
  it('builds a draft link without sending', () => {
    expect(whatsappLink('+20 100', 'بحبك ❤️')).toBe(`https://wa.me/20100?text=${encodeURIComponent('بحبك ❤️')}`);
    expect(whatsappLink('', 'hi')).toBe('https://wa.me/201020022929?text=hi');
  });
});
