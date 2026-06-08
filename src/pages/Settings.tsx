import { useRef, useState } from 'react';
import { Sun, Moon, Upload } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useProgressState } from '../hooks/useProgress';
import { updateSettings, resetAll, importJSON } from '../lib/storage';
import { ConfirmButton } from '../components/Confirm';
import type { TargetRole } from '../types';

const ROLES: { id: TargetRole; label: string; hint: string }[] = [
  { id: 'mid', label: 'Mid', hint: 'Foundations and core concepts' },
  { id: 'senior', label: 'Senior', hint: 'Depth, trade-offs, and design' },
  { id: 'lead', label: 'Lead', hint: 'Architecture and judgement' },
];

export function Settings() {
  const { theme, toggle } = useTheme();
  const { settings } = useProgressState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      setMessage(importJSON(text) ? 'Progress imported.' : 'Could not read that file.');
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">Settings</h2>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-3 font-semibold">Appearance</h3>
        <button
          onClick={toggle}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition hover:text-text"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          Switch to {theme === 'dark' ? 'light' : 'dark'} mode
        </button>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-1 font-semibold">Target role</h3>
        <p className="mb-3 text-sm text-muted">Tunes how you frame your prep across the app.</p>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => updateSettings({ targetRole: r.id })}
              className={`rounded-lg border p-3 text-left transition ${
                settings.targetRole === r.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="text-sm font-medium">{r.label}</div>
              <div className="text-xs text-muted">{r.hint}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-1 font-semibold">AI features (optional)</h3>
        <p className="mb-3 text-sm text-muted">
          Add your own free Gemini API key to unlock AI-generated fresh tests and the AI mock interviewer. It is stored
          only on this device and never leaves your browser except to call Google directly.
        </p>
        <input
          type="password"
          value={settings.geminiApiKey ?? ''}
          onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
          placeholder="Paste your Gemini API key…"
          className="w-full rounded-lg border border-border bg-surface-2 p-2.5 text-sm outline-none focus:border-primary/50"
        />
        <p className="mt-2 text-xs text-muted">
          Get a free key at aistudio.google.com/apikey. AI features that use it are rolling out next.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-3 font-semibold">Data</h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition hover:text-text"
          >
            <Upload className="h-4 w-4" /> Import progress (JSON)
          </button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
          <ConfirmButton
            question="This permanently erases all progress. Continue?"
            confirmLabel="Reset everything"
            onConfirm={() => {
              resetAll();
              setMessage('Progress reset.');
            }}
            className="rounded-lg border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger/10"
          >
            Reset progress
          </ConfirmButton>
        </div>
        {message && <p className="mt-3 text-sm text-muted">{message}</p>}
      </section>
    </div>
  );
}
