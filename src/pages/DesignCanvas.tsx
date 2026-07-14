import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Sparkles,
  Loader2,
  Clock,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { DesignSession, DesignLearningProfile } from '../types';
import { getState, getDesignLearningProfile, recordDesignSession } from '../lib/storage';
import {
  getApiKeys,
  reviewSystemDesign,
  generateDesignChallenge,
  teachFromDesign,
  generateWalkthroughSteps,
  getDesignWeakAreaSummary,
} from '../lib/gemini';
import { ConfirmButton } from '../components/Confirm';
import { useCanvasBoard } from '../hooks/useCanvasBoard';
import { CanvasBoard } from '../components/CanvasBoard';
import { COMPONENT_META, uid } from '../lib/canvas';
import type { ComponentType, CanvasComponent, Connection } from '../lib/canvas';

interface ReviewResult {
  overallScore: number;
  verdict: string;
  whatIsGood: string[];
  bottlenecks: string[];
  missingComponents: string[];
  securityConcerns: string[];
  scalingIssues: string[];
  suggestedImprovements: string[];
}

interface GeneratedChallenge {
  title: string;
  description: string;
  difficulty: string;
  focusArea: string;
  learningGoal: string;
  suggestedComponents: string[];
  hints: string[];
}

interface TeachingResult {
  teachingExplanation: string;
  conceptToReview: string;
  courseLink: string;
  improvedDesignDescription: string;
  encouragement: string;
}

interface WalkthroughStep {
  stepNumber: number;
  componentType: string;
  componentLabel: string;
  heading: string;
  explanation: string;
  whyItMatters: string;
  whatBreaksWithout: string;
  connectionFrom?: string;
  connectionLabel?: string;
}

interface WeakAreaSummary {
  summary: string;
  topWeakAreas: string[];
  studyPlan: string[];
  nextChallengeFocus: string;
}

// Design Canvas's original 12-type palette, kept exactly as-is (Architecture
// Studio has its own, larger palette defined in lib/canvas.ts).
const COMPONENT_TYPES: ComponentType[] = [
  'client',
  'api-gateway',
  'load-balancer',
  'service',
  'database',
  'cache',
  'queue',
  'kafka',
  'cdn',
  'external-api',
  'auth',
  'storage',
];

const PRESET_SCENARIOS = [
  'Design a payment transfer system (like NexusPay)',
  'Design the KYC verification flow',
  'Design an API rate limiting system',
  'Design a real-time notification service',
  'Design a URL shortener at scale',
  'Design a job queue system',
];

type CanvasMode = 'free' | 'guided';

const LEVEL_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Elementary',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

const LEVEL_THRESHOLDS = [0, 30, 80, 180, 350];

function difficultyBadgeClasses(difficulty: string): string {
  const d = difficulty.toLowerCase();
  if (d === 'beginner') return 'rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success';
  if (d === 'elementary') return 'rounded-full bg-teal-400/15 px-2 py-0.5 text-[10px] font-semibold text-teal-400';
  if (d === 'intermediate') return 'rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning';
  if (d === 'advanced') return 'rounded-full bg-orange-400/15 px-2 py-0.5 text-[10px] font-semibold text-orange-400';
  return 'rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-semibold text-danger';
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function scoreColor(score: number): string {
  if (score >= 8) return 'text-success';
  if (score >= 5) return 'text-warning';
  return 'text-danger';
}

function ReviewSection({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (items.length === 0) return null;
  return (
    <details className="rounded-lg border border-border p-2" open>
      <summary className={`cursor-pointer text-xs font-semibold uppercase tracking-wide ${color}`}>{title}</summary>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-text/90">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </details>
  );
}

export function DesignCanvas() {
  const board = useCanvasBoard();
  const {
    components,
    setComponents,
    connections,
    setConnections,
    mode,
    setMode,
    selectedId,
    setSelectedId,
    selectedConnectionId,
    setSelectedConnectionId,
    history,
    pushHistory,
    undo,
    clearCanvas,
  } = board;

  const [scenarioChoice, setScenarioChoice] = useState<string>(PRESET_SCENARIOS[0]);
  const [customScenario, setCustomScenario] = useState('');

  const [canvasMode, setCanvasMode] = useState<CanvasMode>('free');

  // Adaptive guided-practice state
  const [designProfile, setDesignProfile] = useState<DesignLearningProfile>(() => getDesignLearningProfile());
  const [activeChallenge, setActiveChallenge] = useState<GeneratedChallenge | null>(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [challengeStartTime, setChallengeStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hintsRevealedCount, setHintsRevealedCount] = useState(0);
  const [guidedXpGained, setGuidedXpGained] = useState<number | null>(null);
  const [leveledUp, setLeveledUp] = useState(false);

  const [teachingLoading, setTeachingLoading] = useState(false);
  const [teachingError, setTeachingError] = useState<string | null>(null);
  const [teachingResult, setTeachingResult] = useState<TeachingResult | null>(null);

  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughLoading, setWalkthroughLoading] = useState(false);
  const [walkthroughError, setWalkthroughError] = useState<string | null>(null);
  const [walkthroughSteps, setWalkthroughSteps] = useState<WalkthroughStep[]>([]);
  const [walkthroughStepIndex, setWalkthroughStepIndex] = useState(0);
  const [showCompleteBanner, setShowCompleteBanner] = useState(false);

  const [weakAreaModalOpen, setWeakAreaModalOpen] = useState(false);
  const [weakAreaLoading, setWeakAreaLoading] = useState(false);
  const [weakAreaError, setWeakAreaError] = useState<string | null>(null);
  const [weakAreaResult, setWeakAreaResult] = useState<WeakAreaSummary | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);

  const hasApiKey = getApiKeys(getState().settings).length > 0;
  const effectiveScenario = scenarioChoice === 'custom' ? customScenario.trim() || 'Custom scenario' : scenarioChoice;
  const guidedPassed = reviewResult ? reviewResult.overallScore >= 6 : false;

  // Elapsed-time ticker for the active guided challenge; stops once results come in.
  useEffect(() => {
    if (canvasMode !== 'guided' || !activeChallenge || reviewResult) return;
    const id = setInterval(() => {
      setElapsedSeconds(Math.round((Date.now() - (challengeStartTime ?? Date.now())) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [canvasMode, activeChallenge, reviewResult, challengeStartTime]);

  // Clear the auto-populated "complete architecture" preview once the banner has had its moment.
  useEffect(() => {
    if (!showCompleteBanner) return;
    const id = setTimeout(() => {
      setComponents([]);
      setConnections([]);
      setShowCompleteBanner(false);
    }, 3000);
    return () => clearTimeout(id);
  }, [showCompleteBanner]);

  async function handleReview() {
    if (!hasApiKey || components.length === 0) return;
    setReviewOpen(true);
    setReviewLoading(true);
    setReviewError(null);
    setReviewResult(null);
    try {
      const result = await reviewSystemDesign(
        getState().settings,
        effectiveScenario,
        components.map((c) => ({ id: c.id, type: c.type, label: c.label })),
        connections.map((c) => ({ from: c.from, to: c.to, label: c.label })),
      );
      setReviewResult(result);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleGenerateChallenge() {
    if (!hasApiKey) return;
    setChallengeLoading(true);
    setChallengeError(null);
    setReviewOpen(false);
    setReviewResult(null);
    setReviewError(null);
    setTeachingResult(null);
    setTeachingError(null);
    setGuidedXpGained(null);
    setLeveledUp(false);
    setWalkthroughSteps([]);
    setWalkthroughStepIndex(0);
    setWalkthroughError(null);
    setShowCompleteBanner(false);
    try {
      const result = await generateDesignChallenge(getState().settings, {
        currentLevel: designProfile.currentLevel,
        weakAreas: designProfile.weakAreas,
        strongAreas: designProfile.strongAreas,
        recentChallenges: designProfile.sessions.slice(0, 5).map((s) => s.challengeTitle),
      });
      setActiveChallenge(result);
      setHintsRevealedCount(0);
      setChallengeStartTime(Date.now());
      setElapsedSeconds(0);
      setShowWalkthrough(true);
      setWalkthroughLoading(true);
      try {
        const steps = await generateWalkthroughSteps(getState().settings, {
          title: result.title,
          description: result.description,
          focusArea: result.focusArea,
          suggestedComponents: result.suggestedComponents,
          learningGoal: result.learningGoal,
        });
        setWalkthroughSteps(steps);
      } catch (err) {
        setWalkthroughError(err instanceof Error ? err.message : String(err));
      } finally {
        setWalkthroughLoading(false);
      }
    } catch (err) {
      setChallengeError(err instanceof Error ? err.message : String(err));
    } finally {
      setChallengeLoading(false);
    }
  }

  function handleFinishWalkthrough() {
    const laidOutComponents: CanvasComponent[] = walkthroughSteps.map((step, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const type = (COMPONENT_META[step.componentType as ComponentType] ? step.componentType : 'service') as ComponentType;
      return {
        id: uid(),
        type,
        label: step.componentLabel,
        x: 80 + col * 180,
        y: row === 0 ? 200 : 380,
      };
    });

    const labelToId = new Map(walkthroughSteps.map((step, i) => [step.componentLabel, laidOutComponents[i].id]));

    const laidOutConnections: Connection[] = [];
    walkthroughSteps.forEach((step, i) => {
      if (!step.connectionFrom) return;
      const fromId = labelToId.get(step.connectionFrom);
      if (!fromId) return;
      laidOutConnections.push({
        id: uid(),
        from: fromId,
        to: laidOutComponents[i].id,
        label: step.connectionLabel ?? '',
      });
    });

    setComponents(laidOutComponents);
    setConnections(laidOutConnections);
    setShowWalkthrough(false);
    setShowCompleteBanner(true);
  }

  function handleTryAgain() {
    pushHistory();
    setComponents([]);
    setConnections([]);
    setSelectedId(null);
    setSelectedConnectionId(null);
    setReviewOpen(false);
    setReviewResult(null);
    setReviewError(null);
    setTeachingResult(null);
    setTeachingError(null);
    setGuidedXpGained(null);
    setLeveledUp(false);
    setChallengeStartTime(Date.now());
    setElapsedSeconds(0);
  }

  async function handleSubmitGuided() {
    if (!hasApiKey || !activeChallenge || components.length < 2) return;
    setReviewOpen(true);
    setReviewLoading(true);
    setReviewError(null);
    setReviewResult(null);
    setTeachingResult(null);
    setTeachingError(null);
    setGuidedXpGained(null);
    setLeveledUp(false);
    const startedAt = challengeStartTime ?? Date.now();
    try {
      const result = await reviewSystemDesign(
        getState().settings,
        activeChallenge.description,
        components.map((c) => ({ id: c.id, type: c.type, label: c.label })),
        connections.map((c) => ({ from: c.from, to: c.to, label: c.label })),
      );
      setReviewResult(result);

      const passed = result.overallScore >= 6;
      const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      const session: DesignSession = {
        id: uid(),
        timestamp: Date.now(),
        challengeTitle: activeChallenge.title,
        difficulty: activeChallenge.difficulty,
        focusArea: activeChallenge.focusArea,
        score: result.overallScore,
        timeSpentSeconds,
        componentCount: components.length,
        connectionCount: connections.length,
        weakAreasIdentified: passed ? [] : [activeChallenge.focusArea],
        passed,
      };

      const previousLevel = designProfile.currentLevel;
      recordDesignSession(session);
      const updatedProfile = getDesignLearningProfile();
      setDesignProfile(updatedProfile);
      setGuidedXpGained(passed ? 10 : 2);
      setLeveledUp(updatedProfile.currentLevel > previousLevel);

      if (!passed) {
        setTeachingLoading(true);
        try {
          const teaching = await teachFromDesign(
            getState().settings,
            { title: activeChallenge.title, focusArea: activeChallenge.focusArea, description: activeChallenge.description },
            components.map((c) => ({ type: c.type, label: c.label })),
            connections.map((c) => ({ from: c.from, to: c.to, label: c.label })),
            result.overallScore,
            {
              bottlenecks: result.bottlenecks,
              missingComponents: result.missingComponents,
              scalingIssues: result.scalingIssues,
            },
          );
          setTeachingResult(teaching);
        } catch (err) {
          setTeachingError(err instanceof Error ? err.message : String(err));
        } finally {
          setTeachingLoading(false);
        }
      }
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleViewFullAnalysis() {
    if (!hasApiKey || designProfile.totalSessions === 0) return;
    setWeakAreaModalOpen(true);
    setWeakAreaLoading(true);
    setWeakAreaError(null);
    setWeakAreaResult(null);
    try {
      const result = await getDesignWeakAreaSummary(getState().settings, {
        weakAreas: designProfile.weakAreas,
        sessions: designProfile.sessions.map((s) => ({
          challengeTitle: s.challengeTitle,
          score: s.score,
          timeSpentSeconds: s.timeSpentSeconds,
          passed: s.passed,
          focusArea: s.focusArea,
        })),
      });
      setWeakAreaResult(result);
    } catch (err) {
      setWeakAreaError(err instanceof Error ? err.message : String(err));
    } finally {
      setWeakAreaLoading(false);
    }
  }

  const topWeakAreas = Object.entries(designProfile.weakAreas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const topStrongAreas = Object.entries(designProfile.strongAreas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  const xpFloor = LEVEL_THRESHOLDS[designProfile.currentLevel - 1];
  const xpCeil = designProfile.currentLevel < 5 ? LEVEL_THRESHOLDS[designProfile.currentLevel] : xpFloor;
  const xpProgressPercent =
    designProfile.currentLevel >= 5 ? 100 : Math.min(100, ((designProfile.xp - xpFloor) / (xpCeil - xpFloor)) * 100);

  return (
    <div className="space-y-4">
      {/* Mobile notice */}
      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted md:hidden">
        The design canvas works best on a desktop or laptop. Please open it on a larger screen.
      </div>

      {/* Desktop content */}
      <div className="hidden space-y-4 md:block">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Design Canvas</h1>
          <p className="mt-1 text-sm text-muted">
            Drag components onto the board, connect them with arrows, then get a senior-level design review.
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex w-fit overflow-hidden rounded-lg border border-border">
          <button
            onClick={() => setCanvasMode('free')}
            className={`px-4 py-1.5 text-sm transition ${
              canvasMode === 'free' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-text'
            }`}
          >
            Free Canvas
          </button>
          <button
            onClick={() => setCanvasMode('guided')}
            className={`px-4 py-1.5 text-sm transition ${
              canvasMode === 'guided' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-text'
            }`}
          >
            Guided Practice
          </button>
        </div>

        {canvasMode === 'guided' && showWalkthrough && activeChallenge ? (
          /* Walkthrough screen (Guided Practice mode, before the canvas appears) */
          <div className="rounded-xl border border-border bg-surface p-6">
            {walkthroughLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Gemini is preparing your walkthrough...
              </div>
            ) : walkthroughError ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-sm text-danger">{walkthroughError}</p>
                <button
                  onClick={() => setShowWalkthrough(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:text-text"
                >
                  Continue to canvas
                </button>
              </div>
            ) : walkthroughSteps.length > 0 ? (
              (() => {
                const currentStep = walkthroughSteps[walkthroughStepIndex];
                const isLastStep = walkthroughStepIndex === walkthroughSteps.length - 1;
                const meta = COMPONENT_META[currentStep.componentType as ComponentType] ?? COMPONENT_META.service;
                const Icon = meta.icon;
                return (
                  <div className="space-y-4">
                    {/* Top bar */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">{activeChallenge.title}</h2>
                      <span className="text-xs text-muted">
                        Step {walkthroughStepIndex + 1} of {walkthroughSteps.length}
                      </span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${((walkthroughStepIndex + 1) / walkthroughSteps.length) * 100}%` }}
                      />
                    </div>

                    {/* Main content */}
                    <div className="mx-auto max-w-[640px] space-y-6 py-8 text-center">
                      <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                        {currentStep.stepNumber}
                      </span>
                      <h3 className="text-xl font-semibold">{currentStep.heading}</h3>

                      <div className="flex flex-col items-center gap-3">
                        {currentStep.connectionFrom && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted">{currentStep.connectionFrom}</span>
                            <span className="flex flex-col items-center text-primary">
                              <span>&rarr;</span>
                              {currentStep.connectionLabel && (
                                <span className="text-[10px] text-muted">{currentStep.connectionLabel}</span>
                              )}
                            </span>
                            <span className="font-semibold text-primary">[{currentStep.componentLabel}]</span>
                          </div>
                        )}
                        <div
                          className={`flex min-h-[120px] w-[160px] flex-col items-center justify-center gap-2 rounded-2xl border-2 ${meta.border} ${meta.bg}`}
                        >
                          <Icon className={`h-12 w-12 ${meta.text}`} />
                          <span className="text-sm font-semibold text-text">{currentStep.componentLabel}</span>
                        </div>
                      </div>

                      <p className="text-sm text-text/90">{currentStep.explanation}</p>

                      <div className="grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
                        <div className="rounded-lg border border-success/30 bg-success/10 p-3">
                          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Why it matters
                          </h4>
                          <p className="mt-1 text-xs text-text/90">{currentStep.whyItMatters}</p>
                        </div>
                        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
                          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-warning">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            What breaks without it
                          </h4>
                          <p className="mt-1 text-xs text-text/90">{currentStep.whatBreaksWithout}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => setWalkthroughStepIndex((i) => Math.max(0, i - 1))}
                          disabled={walkthroughStepIndex === 0}
                          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:text-text disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          onClick={isLastStep ? handleFinishWalkthrough : () => setWalkthroughStepIndex((i) => i + 1)}
                          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                        >
                          {isLastStep ? 'See complete design' : 'Next'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : null}
          </div>
        ) : (
          <>
        {canvasMode === 'free' ? (
          /* Scenario selector */
          <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">Scenario</label>
            <select
              value={scenarioChoice}
              onChange={(e) => setScenarioChoice(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none"
            >
              {PRESET_SCENARIOS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="custom">Custom scenario</option>
            </select>
            {scenarioChoice === 'custom' && (
              <input
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="Describe your own scenario"
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none"
              />
            )}
            <h2 className="pt-1 text-lg font-semibold">{effectiveScenario}</h2>
          </div>
        ) : (
          /* AI-generated challenge panel */
          <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
            {!activeChallenge ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <h2 className="text-lg font-semibold">Ready for your next challenge?</h2>
                {!hasApiKey ? (
                  <p className="text-sm text-muted">
                    Add your Gemini API key in{' '}
                    <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">
                      Settings
                    </Link>{' '}
                    to generate a challenge.
                  </p>
                ) : challengeLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gemini is choosing a challenge for you...
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateChallenge}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Challenge
                  </button>
                )}
                {challengeError && <p className="text-sm text-danger">{challengeError}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={difficultyBadgeClasses(activeChallenge.difficulty)}>{activeChallenge.difficulty}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
                    {activeChallenge.focusArea}
                  </span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {formatElapsed(elapsedSeconds)}
                  </span>
                </div>
                <h2 className="text-lg font-semibold">{activeChallenge.title}</h2>
                <p className="text-sm text-text/90">{activeChallenge.description}</p>
                <div className="rounded-lg border border-border bg-surface-2 p-2 text-xs text-muted">
                  <span className="font-semibold text-text/80">Learning goal: </span>
                  {activeChallenge.learningGoal}
                </div>
                <details className="rounded-lg border border-border p-2">
                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-primary">
                    Show hints
                  </summary>
                  <div className="mt-2 space-y-1">
                    {activeChallenge.hints.slice(0, hintsRevealedCount).map((h, i) => (
                      <p key={i} className="text-xs text-text/90">
                        {i + 1}. {h}
                      </p>
                    ))}
                    {hintsRevealedCount < activeChallenge.hints.length && (
                      <button
                        onClick={() => setHintsRevealedCount((n) => n + 1)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Reveal hint {hintsRevealedCount + 1}
                      </button>
                    )}
                  </div>
                </details>
                <button onClick={handleGenerateChallenge} className="text-xs text-muted hover:text-text hover:underline">
                  Skip this challenge
                </button>
              </div>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-3">
          <div className="flex overflow-hidden rounded-lg border border-border">
            <button
              onClick={() => setMode('move')}
              className={`px-3 py-1.5 text-sm transition ${
                mode === 'move' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-text'
              }`}
            >
              Move
            </button>
            <button
              onClick={() => setMode('connect')}
              className={`px-3 py-1.5 text-sm transition ${
                mode === 'connect' ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-text'
              }`}
            >
              Connect
            </button>
          </div>

          <ConfirmButton
            question="Clear the entire canvas?"
            confirmLabel="Clear"
            onConfirm={clearCanvas}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:text-text"
          >
            Clear canvas
          </ConfirmButton>

          <button
            onClick={undo}
            disabled={history.length === 0}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:text-text disabled:opacity-40"
          >
            Undo
          </button>

          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted">
            {components.length} components · {connections.length} connections
          </span>

          <button
            onClick={canvasMode === 'guided' ? handleSubmitGuided : handleReview}
            disabled={
              !hasApiKey ||
              (canvasMode === 'guided' ? !activeChallenge || components.length < 2 : components.length === 0)
            }
            className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {canvasMode === 'guided' ? 'Submit Design' : 'Review Design'}
          </button>
        </div>

        {!hasApiKey && (
          <div className="rounded-xl border border-border bg-surface p-3 text-sm text-muted">
            Add your Gemini API key in{' '}
            <Link to="/settings" className="text-primary underline underline-offset-2 hover:opacity-80">
              Settings
            </Link>{' '}
            to unlock design reviews.
          </div>
        )}
        {hasApiKey && components.length === 0 && (
          <p className="text-xs text-muted">Add some components to the canvas first.</p>
        )}

        {showCompleteBanner && (
          <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-center text-sm font-medium text-success animate-fade-in">
            Here is the complete design. Now it is your turn to draw it from scratch.
          </div>
        )}

        {/* Profile panel + Palette + canvas + review/teaching panel */}
        <div className="flex items-start gap-4">
          {/* Learning Profile panel (guided mode only) */}
          {canvasMode === 'guided' && (
            <div className="w-[240px] shrink-0 space-y-3 rounded-xl border border-border bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Learning Profile</p>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                  Level {designProfile.currentLevel}
                </span>
                <span className="text-xs text-muted">{LEVEL_LABELS[designProfile.currentLevel]}</span>
              </div>

              <div className="space-y-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${xpProgressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted">
                  {designProfile.currentLevel >= 5
                    ? `${designProfile.xp} XP (max level)`
                    : `${designProfile.xp} / ${xpCeil} XP`}
                </p>
              </div>

              {designProfile.totalSessions === 0 ? (
                <p className="text-xs text-muted">No sessions yet. Generate your first challenge.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg bg-surface-2 p-2">
                      <div className="text-sm font-semibold">{designProfile.totalSessions}</div>
                      <div className="text-[10px] text-muted">Sessions</div>
                    </div>
                    <div className="rounded-lg bg-surface-2 p-2">
                      <div className="text-sm font-semibold">{designProfile.averageScore.toFixed(1)}</div>
                      <div className="text-[10px] text-muted">Avg score</div>
                    </div>
                  </div>

                  {topWeakAreas.length > 0 && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-warning">Weak areas</p>
                      <div className="flex flex-wrap gap-1">
                        {topWeakAreas.map(([area, count]) => (
                          <span
                            key={area}
                            className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning"
                          >
                            {area} ({count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {topStrongAreas.length > 0 && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-success">Strong areas</p>
                      <div className="flex flex-wrap gap-1">
                        {topStrongAreas.map(([area, count]) => (
                          <span
                            key={area}
                            className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success"
                          >
                            {area} ({count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={handleViewFullAnalysis}
                disabled={!hasApiKey || designProfile.totalSessions === 0}
                className="w-full rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:text-text disabled:opacity-40"
              >
                View full analysis
              </button>
            </div>
          )}

          <CanvasBoard board={board} paletteTypes={COMPONENT_TYPES} />

          {/* Review panel (Free Canvas mode) */}
          {canvasMode === 'free' && reviewOpen && (
            <div className="w-[280px] shrink-0 space-y-3 rounded-xl border border-border bg-surface p-4 animate-slide-down">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Design Review</h3>
                <button onClick={() => setReviewOpen(false)} className="text-muted hover:text-text">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {reviewLoading && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reviewing your design...
                </div>
              )}

              {reviewError && <p className="text-sm text-danger">{reviewError}</p>}

              {reviewResult && (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${scoreColor(reviewResult.overallScore)}`}>
                      {reviewResult.overallScore}/10
                    </div>
                    <p className="mt-1 text-sm text-text/90">{reviewResult.verdict}</p>
                  </div>
                  <ReviewSection title="What's good" items={reviewResult.whatIsGood} color="text-success" />
                  <ReviewSection title="Bottlenecks" items={reviewResult.bottlenecks} color="text-warning" />
                  <ReviewSection title="Missing components" items={reviewResult.missingComponents} color="text-danger" />
                  <ReviewSection title="Security concerns" items={reviewResult.securityConcerns} color="text-danger" />
                  <ReviewSection title="Scaling issues" items={reviewResult.scalingIssues} color="text-warning" />
                  <ReviewSection
                    title="Suggested improvements"
                    items={reviewResult.suggestedImprovements}
                    color="text-primary"
                  />
                </div>
              )}
            </div>
          )}

          {/* Teaching panel (Guided Practice mode) */}
          {canvasMode === 'guided' && reviewOpen && (
            <div className="w-[280px] shrink-0 space-y-3 rounded-xl border border-border bg-surface p-4 animate-slide-down">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Design Review</h3>
                <button onClick={() => setReviewOpen(false)} className="text-muted hover:text-text">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {reviewLoading && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Reviewing your design...
                </div>
              )}

              {reviewError && <p className="text-sm text-danger">{reviewError}</p>}

              {reviewResult && (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${scoreColor(reviewResult.overallScore)}`}>
                      {reviewResult.overallScore}/10
                    </div>
                    <p className="mt-1 text-sm text-text/90">{reviewResult.verdict}</p>
                  </div>

                  {guidedPassed ? (
                    <div className="space-y-2 rounded-lg border border-success/30 bg-success/10 p-3 text-center">
                      <p className="text-sm font-semibold text-success">Well done! Score: {reviewResult.overallScore}/10</p>
                      {guidedXpGained !== null && <p className="text-xs text-success/90">+{guidedXpGained} XP</p>}
                      {leveledUp && (
                        <div className="animate-fade-in rounded-lg bg-primary/15 p-2 text-xs font-semibold text-primary">
                          Level up! You are now Level {designProfile.currentLevel} · {LEVEL_LABELS[designProfile.currentLevel]}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1 rounded-lg border border-warning/30 bg-warning/10 p-3 text-center">
                      <p className="text-sm font-semibold text-warning">
                        Score: {reviewResult.overallScore}/10 · needs improvement
                      </p>
                      {guidedXpGained !== null && <p className="text-xs text-warning/90">+{guidedXpGained} XP for trying</p>}
                    </div>
                  )}

                  <ReviewSection title="What's good" items={reviewResult.whatIsGood} color="text-success" />
                  <ReviewSection title="Bottlenecks" items={reviewResult.bottlenecks} color="text-warning" />
                  <ReviewSection title="Missing components" items={reviewResult.missingComponents} color="text-danger" />

                  {!guidedPassed && (
                    <>
                      <hr className="border-border" />
                      {teachingLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Preparing a teaching breakdown...
                        </div>
                      )}
                      {teachingError && <p className="text-sm text-danger">{teachingError}</p>}
                      {teachingResult && (
                        <div className="space-y-2">
                          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                            <Lightbulb className="h-3.5 w-3.5" />
                            Here is what to understand
                          </h4>
                          <p className="text-xs text-text/90">{teachingResult.teachingExplanation}</p>
                          <div className="rounded-lg border border-primary/30 bg-primary/10 p-2 text-xs text-text/90">
                            <span className="font-semibold text-primary">How to fix this design: </span>
                            {teachingResult.improvedDesignDescription}
                          </div>
                          <Link
                            to={`/courses/${teachingResult.courseLink}`}
                            className="block w-full rounded-lg border border-border px-3 py-1.5 text-center text-xs font-medium text-primary hover:bg-surface-2"
                          >
                            Study this concept: {teachingResult.conceptToReview}
                          </Link>
                          <p className="text-xs italic text-muted">{teachingResult.encouragement}</p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex gap-2 pt-1">
                    {guidedPassed ? (
                      <button
                        onClick={handleGenerateChallenge}
                        className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                      >
                        Next Challenge
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleTryAgain}
                          className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:text-text"
                        >
                          Try Again
                        </button>
                        <button
                          onClick={handleGenerateChallenge}
                          className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                        >
                          New Challenge
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
          </>
        )}
      </div>

      {/* Weak area analysis modal */}
      {weakAreaModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
          onClick={() => setWeakAreaModalOpen(false)}
        >
          <div
            className="w-full max-w-lg space-y-4 rounded-xl border border-border bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Design Weak Area Analysis</h3>
              <button onClick={() => setWeakAreaModalOpen(false)} className="text-muted hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            {weakAreaLoading && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analysing your session history...
              </div>
            )}
            {weakAreaError && <p className="text-sm text-danger">{weakAreaError}</p>}

            {weakAreaResult && (
              <div className="space-y-4">
                <p className="text-sm text-text/90">{weakAreaResult.summary}</p>

                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-warning">Top weak areas</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-text/90">
                    {weakAreaResult.topWeakAreas.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Study plan</h4>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-text/90">
                    {weakAreaResult.studyPlan.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
                  <span className="font-semibold text-primary">Next challenge should focus on: </span>
                  {weakAreaResult.nextChallengeFocus}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
