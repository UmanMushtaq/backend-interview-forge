import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, RotateCcw, Check, X, Loader2, Lightbulb } from 'lucide-react';
import { codingById } from '../data/coding';
import { getState, recordCodingAttempt, saveCodingCode } from '../lib/storage';
import { runTests, type TestResult } from '../lib/runner';
import { CodeEditor } from '../components/CodeEditor';
import { Markdown } from '../components/Markdown';
import { Callout } from '../components/Callout';
import { ConfirmButton } from '../components/Confirm';
import { DifficultyBadge } from '../components/DifficultyBadge';

function fmt(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function CodingChallenge() {
  const { id = '' } = useParams();
  const problem = codingById[id];

  const [code, setCode] = useState(() => getState().codingProgress[id]?.lastCode || problem?.starterCode || '');
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  async function run() {
    if (!problem || running) return;
    setRunning(true);
    saveCodingCode(id, code);
    const res = await runTests(code, problem.testCases);
    setResults(res);
    setRunning(false);
    recordCodingAttempt(id, code, res.every((r) => r.passed));
  }

  // Ctrl/Cmd+Enter to run tests.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        void run();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!problem) {
    return <p className="text-sm text-muted">Problem not found.</p>;
  }

  const passedCount = results?.filter((r) => r.passed).length ?? 0;
  const solved = results !== null && results.length > 0 && passedCount === results.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/code" className="text-sm text-muted hover:text-text">
            ← Coding
          </Link>
          <h2 className="flex items-center gap-3 text-xl font-semibold">
            {problem.title}
            <DifficultyBadge level={problem.difficulty} />
          </h2>
        </div>
        {solved && <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-medium text-success">Solved</span>}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Editor + run bar */}
        <div className="flex flex-col lg:col-span-3">
          <div className="h-[58vh] overflow-hidden rounded-xl border border-border bg-surface">
            <CodeEditor value={code} onChange={setCode} language="typescript" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={run}
              disabled={running}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run tests
            </button>
            <button
              onClick={() => {
                setCode(problem.starterCode);
                setResults(null);
              }}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:text-text"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <span className="ml-auto text-xs text-muted">Ctrl/Cmd + Enter to run</span>
          </div>

          {results && (
            <div className="mt-3 space-y-2 rounded-xl border border-border bg-surface p-4">
              <div className="text-sm font-medium">
                {passedCount}/{results.length} tests passed
              </div>
              {results.map((r, i) => (
                <div key={i} className="rounded-lg bg-surface-2 p-2 text-sm">
                  <div className="flex items-center gap-2">
                    {r.passed ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-danger" />
                    )}
                    <span>{r.name}</span>
                  </div>
                  {!r.passed && (
                    <div className="mt-1 pl-6 text-xs text-muted">
                      {r.error ? (
                        <span className="text-danger">{r.error}</span>
                      ) : r.isHidden && !solved ? (
                        <span>Hidden test — details revealed once all visible tests pass.</span>
                      ) : (
                        <>
                          expected <code>{fmt(r.expected)}</code> · got <code>{fmt(r.actual)}</code>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Problem panel */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface p-4">
            <Markdown>{problem.description}</Markdown>
          </div>

          <Callout title="Why this matters">{problem.interviewContext}</Callout>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-semibold">Hints</h3>
            <div className="space-y-2">
              {problem.hints.slice(0, hintsShown).map((h, i) => (
                <p key={i} className="flex gap-2 text-sm text-text/90">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  {h}
                </p>
              ))}
              {hintsShown < problem.hints.length && (
                <button
                  onClick={() => setHintsShown((n) => n + 1)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Show hint {hintsShown + 1}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-semibold">Solution</h3>
            {showSolution ? (
              <pre className="overflow-x-auto rounded-lg bg-surface-2 p-3 text-xs">
                <code className="font-mono">{problem.solution}</code>
              </pre>
            ) : (
              <ConfirmButton
                question="Reveal the full solution?"
                confirmLabel="Show solution"
                onConfirm={() => setShowSolution(true)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Show solution
              </ConfirmButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
