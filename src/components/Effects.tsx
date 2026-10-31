import { useCallback, useEffect, useState, type CSSProperties, type ReactElement } from 'react';

const HEARTS = ['💖', '💗', '💕', '🩷', '❤️', '💞', '✨'];

/** Gentle floating hearts behind the whole app. */
export function FloatingHearts({ count = 10 }: { count?: number }) {
  const [items] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 12 + Math.random() * 16,
      duration: 12 + Math.random() * 14,
      delay: -Math.random() * 20,
      emoji: HEARTS[i % HEARTS.length],
    })),
  );
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {items.map((h) => (
        <span
          key={h.id}
          className="absolute bottom-[-40px] opacity-0"
          style={{
            left: `${h.left}%`,
            fontSize: h.size,
            animation: `float-up ${h.duration}s linear ${h.delay}s infinite`,
            filter: 'saturate(0.8)',
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  );
}

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
  emoji: string;
}

let pid = 0;

/** Returns [layer, trigger]. Call trigger(x, y, emojis?) to burst particles from a point. */
export function useBurst(): [ReactElement, (x: number, y: number, emojis?: string[], amount?: number) => void] {
  const [particles, setParticles] = useState<Particle[]>([]);
  const trigger = useCallback((x: number, y: number, emojis = HEARTS, amount = 14) => {
    const batch = Array.from({ length: amount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 110;
      return {
        id: pid++,
        x,
        y,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 40,
        rot: Math.random() * 120 - 60,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      };
    });
    setParticles((p) => [...p, ...batch]);
    const ids = new Set(batch.map((b) => b.id));
    window.setTimeout(() => setParticles((p) => p.filter((q) => !ids.has(q.id))), 1100);
  }, []);
  const layer = (
    <div className="pointer-events-none fixed inset-0 z-50" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute text-2xl"
          style={
            {
              left: p.x,
              top: p.y,
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              '--rot': `${p.rot}deg`,
              animation: 'burst 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards',
            } as CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
  return [layer, trigger];
}

/** Full-screen rain of emojis (used for the chocolate emergency). */
export function Rain({ emojis, active, onDone }: { emojis: string[]; active: boolean; onDone?: () => void }) {
  const [drops, setDrops] = useState<{ id: number; left: number; delay: number; dur: number; size: number; emoji: string; rot: number }[]>([]);
  useEffect(() => {
    if (!active) return;
    setDrops(
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        dur: 1.6 + Math.random() * 1.4,
        size: 22 + Math.random() * 22,
        emoji: emojis[i % emojis.length],
        rot: Math.random() * 720 - 360,
      })),
    );
    const t = window.setTimeout(() => {
      setDrops([]);
      onDone?.();
    }, 3400);
    return () => window.clearTimeout(t);
  }, [active, emojis, onDone]);
  if (!drops.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {drops.map((d) => (
        <span
          key={d.id}
          className="absolute top-0"
          style={{ left: `${d.left}%`, fontSize: d.size, animation: `fall ${d.dur}s ease-in ${d.delay}s both`, ['--rot' as string]: `${d.rot}deg` }}
        >
          {d.emoji}
        </span>
      ))}
    </div>
  );
}
