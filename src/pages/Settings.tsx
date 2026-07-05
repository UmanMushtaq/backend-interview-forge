import { useRef, useState } from 'react';
import { Sun, Moon, Upload, Loader2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useProgressState } from '../hooks/useProgress';
import { updateSettings, resetAll, importJSON } from '../lib/storage';
import { testGeminiConnection } from '../lib/gemini';
import { ConfirmButton } from '../components/Confirm';
import type { Settings as SettingsType, TargetRole } from '../types';

const ROLES: { id: TargetRole; label: string; hint: string }[] = [
  { id: 'mid', label: 'Mid', hint: 'Foundations and core concepts' },
  { id: 'senior', label: 'Senior', hint: 'Depth, trade-offs, and design' },
  { id: 'lead', label: 'Lead', hint: 'Architecture and judgement' },
];

type KeyStatus = 'idle' | 'loading' | 'ok' | 'error';

const KEY_FIELDS = [
  { field: 'geminiApiKey', label: 'Key 1', placeholder: 'Paste your Gemini API key…' },
  { field: 'geminiApiKey2', label: 'Key 2', placeholder: 'Gemini API key 2 (optional)' },
  { field: 'geminiApiKey3', label: 'Key 3', placeholder: 'Gemini API key 3 (optional)' },
] as const;

export function Settings() {
  const { theme, toggle } = useTheme();
  const { settings } = useProgressState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [keyStatuses, setKeyStatuses] = useState<Record<string, KeyStatus>>({});
  const [keyErrors, setKeyErrors] = useState<Record<string, string>>({});

  async function testAllKeys() {
    const keys = KEY_FIELDS.map((k) => ({ field: k.field, value: settings[k.field] ?? '' })).filter(
      (k) => k.value.trim().length > 0,
    );
    if (keys.length === 0) return;

    setKeyStatuses((s) => {
      const next = { ...s };
      keys.forEach((k) => (next[k.field] = 'loading'));
      return next;
    });
    setKeyErrors({});

    await Promise.all(
      keys.map(async (k) => {
        try {
          await testGeminiConnection(k.value);
          setKeyStatuses((s) => ({ ...s, [k.field]: 'ok' }));
        } catch (err) {
          setKeyErrors((e) => ({ ...e, [k.field]: err instanceof Error ? err.message : 'Connection failed' }));
          setKeyStatuses((s) => ({ ...s, [k.field]: 'error' }));
        }
      }),
    );
  }

  const anyKeyFilled = KEY_FIELDS.some((k) => (settings[k.field] ?? '').trim().length > 0);
  const anyLoading = Object.values(keyStatuses).some((s) => s === 'loading');

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

        <div className="space-y-3">
          {KEY_FIELDS.map((k, i) => (
            <div key={k.field}>
              {i > 0 && i === 1 && (
                <p className="mb-2 text-xs text-muted">
                  Add up to 3 keys. The platform automatically rotates to the next key when one hits its daily quota
                  limit.
                </p>
              )}
              <input
                type="password"
                value={settings[k.field] ?? ''}
                onChange={(e) => {
                  updateSettings({ [k.field]: e.target.value } as Partial<SettingsType>);
                  setKeyStatuses((s) => ({ ...s, [k.field]: 'idle' }));
                }}
                placeholder={k.placeholder}
                className="w-full rounded-lg border border-border bg-surface-2 p-2.5 text-sm outline-none focus:border-primary/50"
              />
              <div className="mt-1 flex items-center gap-2 text-xs">
                <span className="text-muted">{k.label}:</span>
                {keyStatuses[k.field] === 'loading' && (
                  <span className="flex items-center gap-1 text-muted">
                    <Loader2 className="h-3 w-3 animate-spin" /> Testing…
                  </span>
                )}
                {keyStatuses[k.field] === 'ok' && <span className="font-medium text-success">Connected ✓</span>}
                {keyStatuses[k.field] === 'error' && (
                  <span className="text-danger">{keyErrors[k.field] ?? 'Quota exceeded or connection failed'}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={testAllKeys}
            disabled={!anyKeyFilled || anyLoading}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs transition hover:text-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            {anyLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Test connection
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Get a free key at aistudio.google.com/apikey.
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
