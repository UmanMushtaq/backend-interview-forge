import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Copy, Check } from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { COMPANIES } from '../data/companies';
import { getSalaryAdvice } from '../lib/gemini';

type Situation = 'first-mention' | 'counter-offer' | 'pushback' | 'competing-offer';

const SITUATIONS: Array<{ id: Situation; title: string; description: string }> = [
  { id: 'first-mention', title: 'First mention', description: 'The recruiter asks about your salary expectations for the first time' },
  { id: 'counter-offer', title: 'Counter-offer', description: 'You received an offer and want to negotiate it higher' },
  { id: 'pushback', title: 'Pushback', description: 'They said your expectation is too high' },
  { id: 'competing-offer', title: 'Competing offer', description: 'You have another offer and want to use it as leverage' },
];

interface Advice {
  strategy: string;
  exactWords: string;
  thingsToAvoid: string[];
  followUpMoves: string[];
}

export function SalaryNegotiation() {
  const state = useProgressState();
  const apiKey = state.settings.geminiApiKey ?? '';

  const [situation, setSituation] = useState<Situation | null>(null);
  const [companyId, setCompanyId] = useState('');
  const [otherCompany, setOtherCompany] = useState('');
  const [role, setRole] = useState('Senior Backend Engineer');
  const [years, setYears] = useState(4);
  const [expectation, setExpectation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [copied, setCopied] = useState(false);

  const company = companyId === 'other' ? otherCompany : COMPANIES.find((c) => c.id === companyId)?.name ?? '';
  const canSubmit = situation !== null && expectation.trim().length > 0 && company.trim().length > 0;

  async function submit() {
    if (!situation || !canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const result = await getSalaryAdvice(apiKey, company, role, years, expectation, situation);
      setAdvice(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate advice.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setAdvice(null);
    setError('');
  }

  function copyWords() {
    if (!advice) return;
    navigator.clipboard.writeText(advice.exactWords).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!apiKey) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Salary Negotiation Coach</h1>
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          Add your Gemini API key in{' '}
          <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">
            Settings
          </Link>{' '}
          to unlock the negotiation coach.
        </div>
      </div>
    );
  }

  if (advice) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <h1 className="text-2xl font-bold tracking-tight">Salary Negotiation Coach</h1>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <h2 className="mb-2 text-sm font-semibold text-primary">Strategy</h2>
          <p className="text-sm leading-relaxed text-text/90">{advice.strategy}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">What to say</h2>
            <button
              onClick={copyWords}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition hover:text-text"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-base leading-relaxed">{advice.exactWords}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
            <h3 className="mb-2 text-sm font-semibold text-warning">Things to avoid</h3>
            <ul className="space-y-1.5 text-sm text-text/90">
              {advice.thingsToAvoid.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-success/30 bg-success/5 p-4">
            <h3 className="mb-2 text-sm font-semibold text-success">Follow-up moves</h3>
            <ul className="space-y-1.5 text-sm text-text/90">
              {advice.followUpMoves.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </div>
        </div>

        <button
          onClick={reset}
          className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition hover:text-text"
        >
          Try another situation
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Salary Negotiation Coach</h1>
        <p className="mt-2 text-sm text-muted">
          French tech salary discussions happen early and directly. Get the exact words to say for your
          specific situation.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SITUATIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSituation(s.id)}
            className={`rounded-xl border p-4 text-left transition ${
              situation === s.id ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:border-primary/40'
            }`}
          >
            <div className="font-semibold">{s.title}</div>
            <p className="mt-1 text-sm text-muted">{s.description}</p>
          </button>
        ))}
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Company</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
          >
            <option value="">Select a company...</option>
            {COMPANIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
          {companyId === 'other' && (
            <input
              value={otherCompany}
              onChange={(e) => setOtherCompany(e.target.value)}
              placeholder="Company name"
              className="mt-2 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Role title</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Years of experience</label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              min={0}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Your salary expectation</label>
          <input
            value={expectation}
            onChange={(e) => setExpectation(e.target.value)}
            placeholder="e.g. 65 000 EUR"
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          onClick={submit}
          disabled={!canSubmit || loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Preparing your negotiation script...' : 'Get advice'}
        </button>
      </div>
    </div>
  );
}
