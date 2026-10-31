import { describe, expect, it } from 'vitest';
import { LOVE_REQUESTS, randomRequestMessage } from './requests';
import { whatsappLink } from '../lib/backup';
import { AHMED_WHATSAPP } from '../config';

describe("Sama's Love Requests", () => {
  it('has the six requested buttons in order', () => {
    expect(LOVE_REQUESTS.map((r) => `${r.emoji} ${r.label.ar}`)).toEqual([
      '🍫 عايزة شوكولاتة',
      '🧸 محتاجة حضن',
      '📞 كلمني يا أحمد',
      '💋 وحشتني',
      '🍕 جعانة',
      '💌 رسالة خاصة',
    ]);
  });

  it('every request has messages and builds an encoded wa.me link to Ahmed', () => {
    expect(AHMED_WHATSAPP).toBe('201020022929');
    for (const r of LOVE_REQUESTS) {
      expect(r.messages.length).toBeGreaterThan(0);
      for (const m of r.messages) {
        const link = whatsappLink('', m);
        expect(link).toBe(`https://wa.me/201020022929?text=${encodeURIComponent(m)}`);
        expect(new URL(link).searchParams.get('text')).toBe(m);
      }
    }
  });

  it('a custom number from settings overrides the default', () => {
    expect(whatsappLink('201111111111', 'hi')).toBe('https://wa.me/201111111111?text=hi');
  });

  it('random variants avoid repeating the previous one', () => {
    const r = LOVE_REQUESTS[0];
    for (let i = 0; i < 20; i++) expect(randomRequestMessage(r, r.messages[0])).not.toBe(r.messages[0]);
  });
});
