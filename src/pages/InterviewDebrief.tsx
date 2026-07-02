import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { analyzeDebrief } from '../lib/gemini';

type Feeling = 'great' | 'okay' | 'struggled';

interface DebriefResult {
  analysis: string;
  whatWentWell: string[];
  whatToImprove: string[];
  topicsToStudy: string[];
  estimatedOutcome: string;
}

interface SavedDebrief {
  key: string;
  company: string;
  role: string;
  date: string;
  feeling: Feeling;
  result: DebriefResult;
}

const FEELINGS: Array<{ id: Feeling; label: string }> = [
  { id: 'great', label: 'Went great' },
  { id: 'okay', label: 'Was okay' },
  { id: 'struggled', label: 'Struggled' },
];

const FEELING_STYLES: Record<Feeling, string> = {
  great: 'border-success bg-success/10 text-success',
  okay: 'border-amber-400 bg-amber-400/10 text-amber-400',
  struggled: 'border-danger bg-danger/10 text-danger',
};

const COURSE_IDS = [
  'redis',
  'nestjs',
  'postgresql',
  'kafka',
  'rabbitmq',
  'system-design',
  'microservices',
  'dsa',
  'typescript',
  'nodejs',
  'testing',
  'nexuspay',
];

const POSITIVE_WORDS = ['strong', 'likely to progress', 'good chance', 'well positioned', 'favorable', 'positive'];
const NEGATIVE_WORDS = ['unlikely', 'weak', 'significant gaps', 'poor', 'low chance', 'concerning'];

function outcomeTone(text: string): 'success' | 'danger' | 'warning' {
  const lower = text.toLowerCase();
  if (NEGATIVE_WORDS.some((w) => lower.includes(w))) return 'danger';
  if (POSITIVE_WORDS.some((w) => lower.includes(w))) return 'success';
  return 'warning';
}

const OUTCOME_STYLES: Record<'success' | 'danger' | 'warning', string> = {
  success: 'border-success/30 bg-success/5 text-success',
  warning: 'border-warning/30 bg-warning/5 text-warning',
  danger: 'border-danger/30 bg-danger/5 text-danger',
};

function loadPastDebriefs(): SavedDebrief[] {
  const debriefs: SavedDebrief[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('debrief-')) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as SavedDebrief;
      debriefs.push({ ...parsed, key });
    } catch {
      /* skip corrupt entries */
    }
  }
  return debriefs.sort((a, b) => b.key.localeCompare(a.key));
}

function PastDebriefCard({ debrief }: { debrief: SavedDebrief }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" />}
          <div className="min-w-0">
            <span className="truncate font-medium">{debrief.company}</span>
            <span className="ml-2 text-xs text-muted">{debrief.date}</span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${FEELING_STYLES[debrief.feeling]}`}>
          {FEELINGS.find((f) => f.id === debrief.feeling)?.label}
        </span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border px-4 py-4 text-sm">
          <p className="text-text/90">{debrief.result.analysis}</p>
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">Topics to study</h4>
            <div className="flex flex-wrap gap-2">
              {debrief.result.topicsToStudy.map((t) => (
                <TopicPill key={t} topic={t} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopicPill({ topic }: { topic: string }) {
  const matched = COURSE_IDS.find((id) => topic.toLowerCase().includes(id.replace('-', ' ')) || topic.toLowerCase().includes(id));
  if (matched) {
    return (
      <Link
        to={`/courses/${matched}`}
        className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-primary/20"
      >
        {topic}
      </Link>
    );
  }
  return <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">{topic}</span>;
}

export function InterviewDebrief() {
  const state = useProgressState();
  const apiKey = state.settings.geminiApiKey ?? '';

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('Senior Backend Engineer');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [feeling, setFeeling] = useState<Feeling>('okay');
  const [questionsAsked, setQuestionsAsked] = useState('');
  const [yourAnswers, setYourAnswers] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DebriefResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [pastDebriefs, setPastDebriefs] = useState<SavedDebrief[]>(() => loadPastDebriefs());

  const canSubmit = questionsAsked.trim().length >= 50 && yourAnswers.trim().length >= 50 && company.trim().length > 0;

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const r = await analyzeDebrief(apiKey, company, role, questionsAsked, yourAnswers, feeling);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyse the debrief.');
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!result) return;
    const key = `debrief-${Date.now()}`;
    const entry: SavedDebrief = { key, company, role, date, feeling, result };
    localStorage.setItem(key, JSON.stringify(entry));
    setSaved(true);
    setPastDebriefs(loadPastDebriefs());
  }

  function reset() {
    setResult(null);
    setSaved(false);
    setCompany('');
    setQuestionsAsked('');
    setYourAnswers('');
  }

  const tone = result ? outcomeTone(result.estimatedOutcome) : 'warning';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Interview Debrief</h1>
        <p className="mt-2 text-sm text-muted">
          Log what happened while it is fresh. Gemini will tell you what to study before the next round.
        </p>
      </div>

      {!apiKey && (
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          Add your Gemini API key in{' '}
          <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">
            Settings
          </Link>{' '}
          to unlock debrief analysis.
        </div>
      )}

      {apiKey && !result && (
        <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Company</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted">Role</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Interview date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50 sm:w-56"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Overall feeling</label>
            <div className="flex gap-2">
              {FEELINGS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFeeling(f.id)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    feeling === f.id ? FEELING_STYLES[f.id] : 'border-border hover:border-primary/40'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">What questions did they ask?</label>
            <textarea
              value={questionsAsked}
              onChange={(e) => setQuestionsAsked(e.target.value)}
              placeholder="List every question you remember, even partial ones. Technical, system design, behavioral, anything."
              rows={5}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">How did you answer?</label>
            <textarea
              value={yourAnswers}
              onChange={(e) => setYourAnswers(e.target.value)}
              placeholder="Describe your answers honestly. Where did you feel confident? Where did you stumble or go blank?"
              rows={5}
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
            {loading ? 'Analysing your interview...' : 'Analyse debrief'}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
            <h2 className="mb-2 text-sm font-semibold text-primary">Analysis</h2>
            <p className="text-sm leading-relaxed text-text/90">{result.analysis}</p>
          </div>

          <div className={`rounded-xl border p-4 text-sm font-medium ${OUTCOME_STYLES[tone]}`}>
            {result.estimatedOutcome}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-success/30 bg-success/5 p-4">
              <h3 className="mb-2 text-sm font-semibold text-success">What went well</h3>
              <ul className="space-y-1.5 text-sm text-text/90">
                {result.whatWentWell.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
              <h3 className="mb-2 text-sm font-semibold text-warning">What to improve</h3>
              <ul className="space-y-1.5 text-sm text-text/90">
                {result.whatToImprove.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Topics to study</h3>
            <div className="flex flex-wrap gap-2">
              {result.topicsToStudy.map((t) => (
                <TopicPill key={t} topic={t} />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={saved}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saved ? 'Saved' : 'Save debrief'}
            </button>
            <button
              onClick={reset}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition hover:text-text"
            >
              New debrief
            </button>
          </div>
        </div>
      )}

      {pastDebriefs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Past debriefs</h2>
          <div className="space-y-2">
            {pastDebriefs.map((d) => (
              <PastDebriefCard key={d.key} debrief={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
