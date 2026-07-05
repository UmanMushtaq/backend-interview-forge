import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { COMPANIES } from '../data/companies';
import { generateTakeHomeAssessment, scoreTakeHomeApproach, getApiKeys } from '../lib/gemini';

type Difficulty = 'Mid' | 'Senior' | 'Lead';
type Phase = 'setup' | 'assessment' | 'result';

interface Assessment {
  title: string;
  context: string;
  requirements: string[];
  constraints: string[];
  evaluationCriteria: string[];
}

interface ScoreResult {
  architectureScore: number;
  qualityScore: number;
  communicationScore: number;
  overallScore: number;
  strengths: string[];
  gaps: string[];
  whatReviewersWouldSay: string;
  improvedApproach: string;
}

function barColor(score: number): string {
  if (score >= 7) return 'bg-success';
  if (score >= 4) return 'bg-amber-400';
  return 'bg-danger';
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex-1 text-center">
      <div className="mx-auto mb-2 h-24 w-4 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`w-full rounded-full transition-all duration-500 ${barColor(score)}`}
          style={{ height: `${(score / 10) * 100}%`, marginTop: `${100 - (score / 10) * 100}%` }}
        />
      </div>
      <div className="text-sm font-semibold tabular-nums">{score}/10</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function useElapsed(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return seconds;
}

export function TakeHome() {
  const state = useProgressState();
  const hasApiKey = getApiKeys(state.settings).length > 0;

  const [companyId, setCompanyId] = useState('');
  const [otherCompany, setOtherCompany] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Senior');
  const [phase, setPhase] = useState<Phase>('setup');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [approach, setApproach] = useState('');
  const [scoring, setScoring] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const elapsed = useElapsed(phase === 'assessment');
  const company = companyId === 'other' ? otherCompany : COMPANIES.find((c) => c.id === companyId)?.name ?? '';

  async function generate() {
    if (!company.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const a = await generateTakeHomeAssessment(state.settings, company, difficulty);
      setAssessment(a);
      setApproach('');
      setPhase('assessment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate assessment.');
    } finally {
      setGenerating(false);
    }
  }

  async function submit() {
    if (!assessment || approach.trim().length < 100) return;
    setScoring(true);
    setError('');
    try {
      const r = await scoreTakeHomeApproach(state.settings, assessment, approach);
      setResult(r);
      setPhase('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to score your approach.');
    } finally {
      setScoring(false);
    }
  }

  function newAssessment() {
    setPhase('setup');
    setAssessment(null);
    setResult(null);
    setError('');
  }

  function changeCompany() {
    setCompanyId('');
    newAssessment();
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  if (!hasApiKey) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Take-home Assessment Simulator</h1>
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          Add your Gemini API key in{' '}
          <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">
            Settings
          </Link>{' '}
          to unlock the take-home simulator.
        </div>
      </div>
    );
  }

  if (phase === 'result' && result && assessment) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <h1 className="text-2xl font-bold tracking-tight">{assessment.title}</h1>

        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex justify-center gap-6">
            <ScoreBar label="Architecture" score={result.architectureScore} />
            <ScoreBar label="Code Quality" score={result.qualityScore} />
            <ScoreBar label="Communication" score={result.communicationScore} />
            <ScoreBar label="Overall" score={result.overallScore} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-success/30 bg-success/5 p-4">
            <h3 className="mb-2 text-sm font-semibold text-success">Strengths</h3>
            <ul className="space-y-1.5 text-sm text-text/90">
              {result.strengths.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
            <h3 className="mb-2 text-sm font-semibold text-warning">Gaps</h3>
            <ul className="space-y-1.5 text-sm text-text/90">
              {result.gaps.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-2 p-5">
          <h3 className="mb-2 text-sm font-semibold text-muted">What reviewers would say</h3>
          <p className="text-sm italic leading-relaxed text-text/90">"{result.whatReviewersWouldSay}"</p>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <h3 className="mb-2 text-sm font-semibold text-primary">Improved approach</h3>
          <p className="text-sm leading-relaxed text-text/90">{result.improvedApproach}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => generate()}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Try a new assessment
          </button>
          <button
            onClick={changeCompany}
            className="rounded-xl border border-border px-5 py-2.5 text-sm transition hover:text-text"
          >
            Practice with a different company
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'assessment' && assessment) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">{assessment.title}</h1>
          <span className="tabular-nums text-sm text-muted">
            {mm}:{ss}
          </span>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <p className="text-sm leading-relaxed text-text/90">{assessment.context}</p>

          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Requirements</h3>
            <ul className="space-y-1 text-sm">
              {assessment.requirements.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Constraints</h3>
            <ul className="space-y-1 text-sm">
              {assessment.constraints.map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">Evaluation criteria</h3>
            <ul className="space-y-1 text-sm">
              {assessment.evaluationCriteria.map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Your approach</h2>
          <textarea
            value={approach}
            onChange={(e) => setApproach(e.target.value)}
            placeholder="Describe your technical approach. Include: what stack and architecture you would choose, how you would structure the codebase, what you would prioritise in the time available, how you would handle testing, and what you would include in the README."
            rows={10}
            className="w-full rounded-xl border border-border bg-surface p-4 text-sm outline-none focus:border-primary/50"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            onClick={submit}
            disabled={approach.trim().length < 100 || scoring}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {scoring && <Loader2 className="h-4 w-4 animate-spin" />}
            {scoring ? 'Scoring your approach...' : 'Submit approach'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Take-home Assessment Simulator</h1>
        <p className="mt-2 text-sm text-muted">
          Qonto, Alan, and Swan all include a 3-5 hour take-home project. Practice planning your approach
          and get it scored before the real thing.
        </p>
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

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Difficulty</label>
          <div className="flex gap-2">
            {(['Mid', 'Senior', 'Lead'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  difficulty === d ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          onClick={generate}
          disabled={!company.trim() || generating}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating && <Loader2 className="h-4 w-4 animate-spin" />}
          {generating ? 'Generating your assessment...' : 'Generate assessment'}
        </button>
      </div>
    </div>
  );
}
