import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { architectureModuleById } from '../data/architecture';
import { useProgressState } from '../hooks/useProgress';
import { getState, markArchitectureLessonRead, markArchitectureLessonDesigned, recordArchitectureReview } from '../lib/storage';
import { getApiKeys, reviewArchitectureStudioDesign } from '../lib/gemini';
import { useCanvasBoard } from '../hooks/useCanvasBoard';
import { CanvasBoard } from '../components/CanvasBoard';
import { ALL_COMPONENT_TYPES, COMPONENT_META } from '../lib/canvas';
import type { ComponentType } from '../lib/canvas';
import type { ArchitectureVerdict } from '../types';
import { Markdown } from '../components/Markdown';

type Phase = 'read' | 'design' | 'review';

const VERDICT_META: Record<ArchitectureVerdict, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  correct: { label: 'Correct', className: 'bg-success/15 text-success', icon: CheckCircle2 },
  'partially-correct': { label: 'Partially correct', className: 'bg-warning/15 text-warning', icon: AlertTriangle },
  'missing-something': { label: 'Missing something', className: 'bg-danger/15 text-danger', icon: XCircle },
};

export function ArchitectureStudioLesson() {
  const { moduleId = '', lessonId = '' } = useParams();
  const state = useProgressState();
  const mod = architectureModuleById[moduleId];
  const lessonIndex = mod?.lessons.findIndex((l) => l.id === lessonId) ?? -1;
  const lesson = lessonIndex >= 0 ? mod?.lessons[lessonIndex] : undefined;
  const nextLesson = mod && lessonIndex >= 0 ? mod.lessons[lessonIndex + 1] : undefined;

  const hasApiKey = getApiKeys(state.settings).length > 0;
  const entry = lesson ? state.architectureProgress?.[lesson.id] : undefined;

  const [phase, setPhase] = useState<Phase>('read');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<ArchitectureVerdict | null>(entry?.lastVerdict ?? null);
  const [reason, setReason] = useState<string | null>(entry?.lastFeedback ?? null);

  const allowedTypes = (lesson?.designChallenge.allowedComponents?.filter(
    (t): t is ComponentType => t in COMPONENT_META,
  ) ?? ALL_COMPONENT_TYPES) as ComponentType[];

  const board = useCanvasBoard();

  if (!mod || !lesson) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Lesson not found.</p>
        <Link to="/architecture-studio" className="text-sm text-primary hover:underline">
          ← Back to Architecture Studio
        </Link>
      </div>
    );
  }

  function startDesignPhase() {
    markArchitectureLessonRead(lesson!.id);
    setPhase('design');
  }

  async function submitForReview() {
    if (!hasApiKey || board.components.length === 0) return;
    markArchitectureLessonDesigned(lesson!.id);
    setPhase('review');
    setReviewLoading(true);
    setReviewError(null);
    try {
      const result = await reviewArchitectureStudioDesign(
        getState().settings,
        { title: lesson!.title, concept: lesson!.content, gradingCriteria: lesson!.designChallenge.gradingCriteria },
        {
          components: board.components.map((c) => ({ type: c.type, label: c.label })),
          connections: board.connections.map((c) => ({ from: c.from, to: c.to, label: c.label })),
        },
      );
      setVerdict(result.verdict);
      setReason(result.reason);
      recordArchitectureReview(lesson!.id, result.verdict, result.reason);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setReviewLoading(false);
    }
  }

  const verdictMeta = verdict ? VERDICT_META[verdict] : null;
  const VerdictIcon = verdictMeta?.icon;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link to="/architecture-studio" className="flex items-center gap-1 text-xs text-muted hover:text-text">
        <ArrowLeft className="h-3.5 w-3.5" />
        Architecture Studio · {mod.title}
      </Link>

      {phase === 'read' && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">{lesson.title}</h1>
          <Markdown>{lesson.content}</Markdown>
          <button
            onClick={startDesignPhase}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            I've read this, let's design it
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {phase === 'design' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold tracking-tight">{lesson.title}</h1>
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-text/90">
            {lesson.designChallenge.prompt}
          </div>

          {!hasApiKey && (
            <div className="rounded-xl border border-border bg-surface p-3 text-sm text-muted">
              Add your Gemini API key in{' '}
              <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">
                Settings
              </Link>{' '}
              to get your design reviewed.
            </div>
          )}

          <CanvasBoard board={board} paletteTypes={allowedTypes} minHeightClass="min-h-[480px]" />

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
              {board.components.length} components · {board.connections.length} connections
            </span>
            <button
              onClick={submitForReview}
              disabled={!hasApiKey || board.components.length === 0}
              className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              Submit for review
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {phase === 'review' && (
        <div className="space-y-4">
          <h1 className="text-xl font-bold tracking-tight">{lesson.title}</h1>

          <div className="rounded-xl border border-border bg-surface p-4">
            {reviewLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Gemini is grading your design...
              </div>
            ) : reviewError ? (
              <p className="text-sm text-danger">{reviewError}</p>
            ) : (
              verdictMeta &&
              VerdictIcon && (
                <div className="space-y-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${verdictMeta.className}`}
                  >
                    <VerdictIcon className="h-4 w-4" />
                    {verdictMeta.label}
                  </span>
                  <p className="text-sm text-text/90">{reason}</p>
                </div>
              )
            )}
          </div>

          <CanvasBoard board={board} paletteTypes={allowedTypes} minHeightClass="min-h-[360px]" />

          <div className="flex gap-3">
            <button
              onClick={() => setPhase('design')}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:text-text"
            >
              Back to design
            </button>
            {nextLesson ? (
              <Link
                to={`/architecture-studio/${mod.id}/${nextLesson.id}`}
                className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Next lesson
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/architecture-studio"
                className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Back to Architecture Studio
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
