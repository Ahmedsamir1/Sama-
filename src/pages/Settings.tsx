import { useRef, useState } from 'react';
import { PageTitle, Stepper, Toggle } from '../components/UI';
import { Bunny } from '../components/Bunny';
import { createBackup, parseBackup } from '../lib/backup';
import { db } from '../lib/db';
import { AHMED_WHATSAPP } from '../config';
import { useStore } from '../lib/store';

declare const __APP_VERSION__: string;

export function Settings({ onClose }: { onClose: () => void }) {
  const { t, settings, periods, moods, updateSettings, reload, showToast, today } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [number, setNumber] = useState(settings.whatsappNumber);

  async function exportData() {
    const backup = createBackup(periods, moods, settings);
    const json = JSON.stringify(backup, null, 2);
    const name = `sama-backup-${today}.json`;
    const file = new File([json], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: name });
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast(t.exportDone);
  }

  async function importData(file: File) {
    try {
      const backup = parseBackup(await file.text());
      if (!window.confirm(t.importConfirm)) return;
      await db.replaceAll({ periods: backup.periods, moods: backup.moods, settings: { ...backup.settings, privacyAcknowledged: true } });
      await reload();
      showToast(t.importDone);
    } catch {
      showToast(t.importFailed);
    }
  }

  async function deleteAll() {
    if (!window.confirm(t.deleteConfirm1)) return;
    if (!window.confirm(t.deleteConfirm2)) return;
    await db.clearAll();
    await reload();
    showToast(t.deleteDone);
  }

  return (
    <div className="space-y-4">
      <PageTitle
        title={t.settingsTitle}
        right={
          <button className="btn btn-soft !px-4 !py-2 text-sm" onClick={onClose}>
            {t.close}
          </button>
        }
      />

      <section className="card p-4">
        <h2 className="mb-2 font-extrabold text-blush-600">{t.language}</h2>
        <div className="grid grid-cols-2 gap-2">
          {(['ar', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => updateSettings({ language: l })}
              className={`btn ${settings.language === l ? 'btn-primary' : 'btn-soft'}`}
            >
              {l === 'ar' ? 'العربي المصري' : 'English'}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-1 font-extrabold text-blush-600">{t.cycleSettings}</h2>
        <Toggle checked={settings.autoAverage} onChange={(v) => updateSettings({ autoAverage: v })} label={t.autoAverage} />
        <Stepper label={t.manualCycleLength} value={settings.cycleLength} min={15} max={60} onChange={(v) => updateSettings({ cycleLength: v })} />
        <Stepper label={t.manualPeriodLength} value={settings.periodLength} min={1} max={14} onChange={(v) => updateSettings({ periodLength: v })} />
        <p className="mt-1 text-xs text-ink/60">{t.autoHint}</p>
      </section>

      <section className="card p-4">
        <h2 className="mb-2 font-extrabold text-blush-600">{t.whatsappNumber}</h2>
        <input
          inputMode="numeric"
          dir="ltr"
          value={number}
          placeholder={AHMED_WHATSAPP}
          onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 20))}
          onBlur={() => number !== settings.whatsappNumber && updateSettings({ whatsappNumber: number }).then(() => showToast(t.saved))}
          className="w-full rounded-2xl border border-blush-200 bg-white px-4 py-3"
        />
        <p className="mt-2 text-xs text-ink/60">{t.whatsappNumberHint}</p>
      </section>

      <section className="card space-y-2 p-4">
        <h2 className="mb-1 font-extrabold text-blush-600">{t.data}</h2>
        <button className="btn btn-soft w-full" onClick={exportData}>
          ⬇️ {t.exportData}
        </button>
        <button className="btn btn-soft w-full" onClick={() => fileRef.current?.click()}>
          ⬆️ {t.importData}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importData(f);
            e.target.value = '';
          }}
        />
        <button className="btn w-full bg-red-50 text-red-600" onClick={deleteAll}>
          🗑 {t.deleteAll}
        </button>
      </section>

      <PrivacyCard />

      <footer className="flex flex-col items-center pb-4 text-center text-xs text-ink/60">
        <Bunny size={64} holding="moon" mood="sleepy" />
        <p className="font-bold text-blush-500">{t.about}</p>
        <p className="mt-1">
          {t.version} {__APP_VERSION__}
        </p>
      </footer>
    </div>
  );
}

export function PrivacyCard({ onAcknowledge }: { onAcknowledge?: () => void }) {
  const { t } = useStore();
  return (
    <section className="card p-4">
      <h2 className="mb-2 font-extrabold text-blush-600">{t.privacyTitle}</h2>
      <ul className="space-y-2 text-sm leading-relaxed">
        {t.privacyBody.map((line) => (
          <li key={line} className="flex gap-2">
            <span>🩷</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {onAcknowledge && (
        <button className="btn btn-primary mt-4 w-full" onClick={onAcknowledge}>
          {t.privacyOk}
        </button>
      )}
    </section>
  );
}
