import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { COMPANIES } from '../data/companies';
import { reviewCV, generateCoverLetter, getApiKeys } from '../lib/gemini';
import type { Settings } from '../types';

type Tab = 'review' | 'letter';
type Tone = 'formal' | 'direct' | 'enthusiastic';

// ─── Company selector ─────────────────────────────────────────────────────────

function CompanySelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isOther = value !== '' && !COMPANIES.some((c) => c.name === value);
  const selectValue = isOther ? '__other__' : value;

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === '__other__') {
      onChange('');
    } else {
      onChange(e.target.value);
    }
  }

  return (
    <div className="space-y-2">
      <select
        value={selectValue}
        onChange={handleSelect}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="">Select a company…</option>
        {COMPANIES.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
        <option value="__other__">Other</option>
      </select>
      {selectValue === '__other__' && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter company name"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}
    </div>
  );
}

// ─── CV Review tab ────────────────────────────────────────────────────────────

type ReviewResult = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
};

function CVReviewTab({ settings }: { settings: Settings }) {
  const [cvText, setCvText] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);

  const canSubmit = cvText.trim().length >= 100 && company.trim().length > 0;

  async function handleReview() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await reviewCV(settings, cvText, company);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError('');
  }

  const scoreColor =
    result
      ? result.score >= 7
        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        : result.score >= 5
          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          : 'bg-red-500/20 text-red-400 border-red-500/30'
      : '';

  const scoreLabel =
    result
      ? result.score >= 7
        ? 'Strong CV for this role'
        : result.score >= 5
          ? 'Good but needs work'
          : 'Significant improvements needed'
      : '';

  if (result) {
    return (
      <div className="space-y-6">
        {/* Score */}
        <div className="flex items-center gap-4">
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl font-bold tabular-nums ${scoreColor}`}
          >
            {result.score}
          </span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">ATS + Recruiter score</div>
            <div className="mt-0.5 font-semibold">{scoreLabel}</div>
            <div className="text-xs text-muted">Target: {company}</div>
          </div>
        </div>

        {/* Strengths */}
        {result.strengths.length > 0 && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Strengths
            </p>
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {result.weaknesses.length > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400">
              <XCircle className="h-4 w-4" /> Weaknesses
            </p>
            <ul className="space-y-2">
              {result.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {result.suggestions.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Lightbulb className="h-4 w-4" /> Actionable suggestions
            </p>
            <ul className="space-y-2">
              {result.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-surface-2"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Review again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Your CV</label>
        <textarea
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          rows={10}
          placeholder="Paste your full CV text here."
          className="w-full resize-y rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          style={{ minHeight: '200px' }}
        />
        <p className="mt-1 text-xs text-muted">{cvText.trim().length} characters</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Target company</label>
        <CompanySelector value={company} onChange={setCompany} />
      </div>

      {error && (
        <div className="space-y-2">
          <p className="text-sm text-danger">{error}</p>
          <button onClick={handleReview} className="text-xs text-primary hover:underline">
            Try again
          </button>
        </div>
      )}

      <button
        onClick={handleReview}
        disabled={!canSubmit || loading}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gemini is reviewing your CV…
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Review my CV
          </>
        )}
      </button>
    </div>
  );
}

// ─── Cover Letter tab ─────────────────────────────────────────────────────────

function CoverLetterTab({ settings }: { settings: Settings }) {
  const [summary, setSummary] = useState('');
  const [company, setCompany] = useState('');
  const [roleTitle, setRoleTitle] = useState('Senior Backend Engineer');
  const [tone, setTone] = useState<Tone>('direct');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [letter, setLetter] = useState('');
  const [copied, setCopied] = useState(false);

  const canSubmit = summary.trim().length >= 50 && company.trim().length > 0;
  const wordCount = letter.trim() ? letter.trim().split(/\s+/).length : 0;

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setLetter('');
    try {
      const result = await generateCoverLetter(settings, summary, company, roleTitle, tone);
      setLetter(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may be unavailable
    }
  }

  const tones: { value: Tone; label: string }[] = [
    { value: 'formal', label: 'Formal' },
    { value: 'direct', label: 'Direct' },
    { value: 'enthusiastic', label: 'Enthusiastic' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Your background</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={6}
          placeholder="Paste a short summary of your experience, or paste your full CV. The more context you give, the better the letter."
          className="w-full resize-y rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          style={{ minHeight: '120px' }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Target company</label>
          <CompanySelector value={company} onChange={setCompany} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Role title</label>
          <input
            type="text"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Tone</label>
        <div className="flex gap-2">
          {tones.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTone(value)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                tone === value
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border text-muted hover:border-primary/50 hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="space-y-2">
          <p className="text-sm text-danger">{error}</p>
          <button onClick={handleGenerate} className="text-xs text-primary hover:underline">
            Try again
          </button>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={!canSubmit || loading}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Writing your cover letter…
          </>
        ) : (
          'Generate cover letter'
        )}
      </button>

      {letter && (
        <div className="space-y-3">
          <div
            className="rounded-xl border border-border bg-surface p-6 text-sm text-text"
            style={{ lineHeight: '1.8' }}
          >
            {letter.split('\n').map((line, i) => (
              <p key={i} className={line === '' ? 'mt-4' : ''}>
                {line}
              </p>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-surface-2"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy to clipboard
                </>
              )}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-surface-2 disabled:opacity-40"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Regenerate
            </button>
            <span className="text-xs text-muted">{wordCount} words</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CVAssistant() {
  const { settings } = useProgressState();
  const hasApiKey = getApiKeys(settings).length > 0;
  const [tab, setTab] = useState<Tab>('review');

  if (!hasApiKey) {
    return (
      <div className="py-20 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-muted/40" />
        <p className="text-lg font-semibold">CV Assistant</p>
        <p className="mt-2 text-sm text-muted">
          Add your Gemini API key in{' '}
          <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">
            Settings
          </Link>{' '}
          to use the CV Assistant.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CV Assistant</h1>
        <p className="mt-1 text-sm text-muted">
          Get honest feedback on your CV and generate targeted cover letters powered by Gemini.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['review', 'letter'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
              tab === t
                ? 'bg-primary text-white'
                : 'border border-border text-muted hover:border-primary/50 hover:text-text'
            }`}
          >
            {t === 'review' ? 'CV Review' : 'Cover Letter'}
          </button>
        ))}
      </div>

      {tab === 'review' && <CVReviewTab settings={settings} />}
      {tab === 'letter' && <CoverLetterTab settings={settings} />}
    </div>
  );
}
