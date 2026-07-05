import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Send } from 'lucide-react';
import { useProgressState } from '../hooks/useProgress';
import { getDesignInterviewResponse, getApiKeys } from '../lib/gemini';

type Difficulty = 'Mid' | 'Senior' | 'Lead';
type Phase = 'requirements' | 'design' | 'deep-dive' | 'wrap-up';

const PHASES: Phase[] = ['requirements', 'design', 'deep-dive', 'wrap-up'];
const PHASE_LABELS: Record<Phase, string> = {
  requirements: 'Requirements',
  design: 'Design',
  'deep-dive': 'Deep Dive',
  'wrap-up': 'Wrap-up',
};

const QUESTIONS = [
  'Design a payment transfer system (like NexusPay)',
  'Design a real-time notification service',
  'Design a rate limiting system',
  'Design a URL shortener at scale',
  'Design a job queue system',
  'Design an API gateway',
  'Design a KYC verification system',
];

interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
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

export function DesignInterview() {
  const state = useProgressState();
  const hasApiKey = getApiKeys(state.settings).length > 0;

  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Senior');
  const [started, setStarted] = useState(false);

  const [question, setQuestion] = useState('');
  const [phase, setPhase] = useState<Phase>('requirements');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wrapUp, setWrapUp] = useState<{ score?: number; feedback?: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const elapsed = useElapsed(started && !wrapUp);

  const isCustom = selectedQuestion === 'custom';
  const canStart = (selectedQuestion !== null && !isCustom) || (isCustom && customQuestion.trim().length > 0);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function startInterview() {
    const q = isCustom ? customQuestion.trim() : selectedQuestion!;
    setQuestion(q);
    setStarted(true);
    setPhase('requirements');
    setMessages([]);
    setLoading(true);
    setError('');
    try {
      const res = await getDesignInterviewResponse(state.settings, q, [], 'requirements');
      setMessages([{ role: 'interviewer', content: res.response }]);
      if (res.nextPhase && PHASES.includes(res.nextPhase as Phase)) setPhase(res.nextPhase as Phase);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start the interview.');
    } finally {
      setLoading(false);
    }
  }

  async function send(content: string, forcedPhase?: Phase) {
    const history: Message[] = content ? [...messages, { role: 'candidate', content }] : messages;
    if (content) setMessages(history);
    setInput('');
    setLoading(true);
    setError('');
    const targetPhase = forcedPhase ?? phase;
    try {
      const res = await getDesignInterviewResponse(state.settings, question, history, targetPhase);
      setMessages((m) => [...m, { role: 'interviewer', content: res.response }]);
      if (targetPhase === 'wrap-up' || res.nextPhase === 'wrap-up') {
        setPhase('wrap-up');
        setWrapUp({ score: res.score, feedback: res.feedback });
      } else if (res.nextPhase && PHASES.includes(res.nextPhase as Phase)) {
        setPhase(res.nextPhase as Phase);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get a response.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    if (!input.trim() || loading) return;
    send(input.trim());
  }

  function endInterview() {
    if (loading) return;
    send('', 'wrap-up');
  }

  function reset() {
    setStarted(false);
    setSelectedQuestion(null);
    setCustomQuestion('');
    setMessages([]);
    setWrapUp(null);
    setError('');
  }

  if (!hasApiKey) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">System Design Interview</h1>
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
          Add your Gemini API key in{' '}
          <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">
            Settings
          </Link>{' '}
          to unlock the design interview simulator.
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Design Interview</h1>
          <p className="mt-2 text-sm text-muted">
            Gemini plays the interviewer. It asks follow-up questions in real time as you explain your
            design. This trains the think out loud skill that separates good candidates from great ones.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setSelectedQuestion(q)}
              className={`rounded-xl border p-4 text-left text-sm font-medium transition ${
                selectedQuestion === q ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface hover:border-primary/40'
              }`}
            >
              {q}
            </button>
          ))}
          <button
            onClick={() => setSelectedQuestion('custom')}
            className={`rounded-xl border p-4 text-left text-sm font-medium transition ${
              selectedQuestion === 'custom' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface hover:border-primary/40'
            }`}
          >
            Custom question
          </button>
        </div>

        {isCustom && (
          <input
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Describe the system you want to design..."
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
        )}

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
          onClick={startInterview}
          disabled={!canStart}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start interview
        </button>
      </div>
    );
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const phaseIndex = PHASES.indexOf(phase);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{question}</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
              {PHASE_LABELS[phase]}
            </span>
            <span className="tabular-nums text-xs text-muted">
              {mm}:{ss}
            </span>
          </div>
        </div>
        <button
          onClick={endInterview}
          disabled={loading || phase === 'wrap-up'}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          End interview
        </button>
      </div>

      <div className="flex items-center gap-2 px-1">
        {PHASES.map((p, i) => (
          <div
            key={p}
            className={`h-1.5 flex-1 rounded-full ${i <= phaseIndex ? 'bg-primary' : 'bg-surface-2'}`}
            title={PHASE_LABELS[p]}
          />
        ))}
      </div>

      <div ref={scrollRef} className="max-h-[400px] space-y-3 overflow-y-auto rounded-xl border border-border bg-surface p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${m.role === 'candidate' ? 'text-right' : ''}`}>
              {m.role === 'interviewer' && <div className="mb-1 text-xs font-medium text-muted">Interviewer</div>}
              <div
                className={`inline-block rounded-lg px-3.5 py-2 text-left text-sm leading-relaxed ${
                  m.role === 'candidate' ? 'bg-primary/15 text-text' : 'bg-surface-2 text-text/90'
                }`}
              >
                {m.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Interviewer is thinking...
          </div>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>

      {wrapUp && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <h3 className="mb-2 text-sm font-semibold text-primary">Interview complete</h3>
          {typeof wrapUp.score === 'number' && (
            <div className="mb-2 text-3xl font-bold">{wrapUp.score}/10</div>
          )}
          {wrapUp.feedback && <p className="text-sm leading-relaxed text-text/90">{wrapUp.feedback}</p>}
          <button
            onClick={reset}
            className="mt-4 rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:text-text"
          >
            Practice another question
          </button>
        </div>
      )}

      {!wrapUp && (
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder="Type your response... explain your thinking out loud"
            disabled={loading}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary/50 disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            className="flex shrink-0 items-center justify-center rounded-lg bg-primary p-2.5 text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
