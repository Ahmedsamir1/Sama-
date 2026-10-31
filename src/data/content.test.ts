import { describe, expect, it } from 'vitest';
import { AHMED_MESSAGES, messageOfTheDay } from './messages';
import { COMPLIMENTS, SUPPORT_MESSAGES, SURPRISES } from './kit';
import { DICTS } from '../lib/i18n';

describe('content', () => {
  it('has at least 40 unique messages from Ahmed', () => {
    expect(AHMED_MESSAGES.length).toBeGreaterThanOrEqual(40);
    expect(new Set(AHMED_MESSAGES).size).toBe(AHMED_MESSAGES.length);
  });

  it('message of the day is stable for a date', () => {
    expect(messageOfTheDay('2026-10-31')).toBe(messageOfTheDay('2026-10-31'));
    expect(AHMED_MESSAGES).toContain(messageOfTheDay('2027-01-01'));
  });

  it('kit content is bilingual', () => {
    for (const item of [...SUPPORT_MESSAGES, ...SURPRISES, ...COMPLIMENTS]) {
      expect(item.ar.length).toBeGreaterThan(0);
      expect(item.en.length).toBeGreaterThan(0);
    }
  });

  it('Arabic and English dictionaries have the same keys', () => {
    expect(Object.keys(DICTS.en).sort()).toEqual(Object.keys(DICTS.ar).sort());
    expect(Object.keys(DICTS.en.symptomList).sort()).toEqual(Object.keys(DICTS.ar.symptomList).sort());
    expect(DICTS.ar.greetingMorning).toBe('صباح الفل يا سما ❤️');
  });
});
