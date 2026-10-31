import { useEffect, type ReactNode } from 'react';
import { useStore } from '../lib/store';

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const { t } = useStore();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" aria-label={t.close} onClick={onClose} />
      <div className="animate-slide-up pb-safe relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-cream-50 px-5 pt-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-blush-200" />
        {title && <h2 className="mb-4 text-center text-lg font-extrabold text-blush-600">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center pt-safe" role="status" aria-live="polite">
      <div className="animate-pop mt-2 rounded-full bg-white/95 px-5 py-3 text-sm font-bold text-blush-600 shadow-lg ring-1 ring-blush-200">{toast}</div>
    </div>
  );
}

export function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-blush-600">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink/70">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-2 text-start"
    >
      <span className="text-sm font-semibold">{label}</span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-blush-400' : 'bg-blush-100'}`}>
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'start-[1.4rem]' : 'start-0.5'}`}
        />
      </span>
    </button>
  );
}

export function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-2" dir="ltr">
        <button type="button" className="btn btn-soft h-9 w-9 !p-0 text-lg" onClick={() => onChange(Math.max(min, value - 1))} aria-label="-">
          −
        </button>
        <span className="w-8 text-center text-lg font-extrabold tabular-nums">{value}</span>
        <button type="button" className="btn btn-soft h-9 w-9 !p-0 text-lg" onClick={() => onChange(Math.min(max, value + 1))} aria-label="+">
          +
        </button>
      </div>
    </div>
  );
}
