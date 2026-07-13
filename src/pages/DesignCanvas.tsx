import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Monitor,
  Shield,
  GitFork,
  Server,
  Database,
  Zap,
  Radio,
  Layers,
  Globe,
  Link as LinkIcon,
  Lock,
  HardDrive,
  X,
  Sparkles,
  Loader2,
  Clock,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DesignSession, DesignLearningProfile } from '../types';
import { getState, getDesignLearningProfile, recordDesignSession } from '../lib/storage';
import {
  getApiKeys,
  reviewSystemDesign,
  generateDesignChallenge,
  teachFromDesign,
  teachBeforeDesign,
  getDesignWeakAreaSummary,
} from '../lib/gemini';
import { ConfirmButton } from '../components/Confirm';

type ComponentType =
  | 'client'
  | 'api-gateway'
  | 'load-balancer'
  | 'service'
  | 'database'
  | 'cache'
  | 'queue'
  | 'kafka'
  | 'cdn'
  | 'external-api'
  | 'auth'
  | 'storage';

interface CanvasComponent {
  id: string;
  type: ComponentType;
  label: string;
  x: number;
  y: number;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  label: string;
}

type Mode = 'move' | 'connect';

interface Snapshot {
  components: CanvasComponent[];
  connections: Connection[];
}

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

interface PreDesignTeaching {
  lesson: string;
  componentExplanations: Array<{ component: string; whatItDoes: string }>;
  simpleFlowDiagram: string;
  keyInsight: string;
}

interface WeakAreaSummary {
  summary: string;
  topWeakAreas: string[];
  studyPlan: string[];
  nextChallengeFocus: string;
}

const COMPONENT_META: Record<
  ComponentType,
  { paletteLabel: string; defaultLabel: string; icon: LucideIcon; border: string; bg: string; text: string }
> = {
  client: { paletteLabel: 'Client', defaultLabel: 'Client', icon: Monitor, border: 'border-blue-400', bg: 'bg-blue-400/10', text: 'text-blue-400' },
  'api-gateway': { paletteLabel: 'API Gateway', defaultLabel: 'API Gateway', icon: Shield, border: 'border-violet-400', bg: 'bg-violet-400/10', text: 'text-violet-400' },
  'load-balancer': { paletteLabel: 'Load Balancer', defaultLabel: 'Load Balancer', icon: GitFork, border: 'border-orange-400', bg: 'bg-orange-400/10', text: 'text-orange-400' },
  service: { paletteLabel: 'Service', defaultLabel: 'Service', icon: Server, border: 'border-green-400', bg: 'bg-green-400/10', text: 'text-green-400' },
  database: { paletteLabel: 'Database', defaultLabel: 'Database', icon: Database, border: 'border-indigo-400', bg: 'bg-indigo-400/10', text: 'text-indigo-400' },
  cache: { paletteLabel: 'Cache / Redis', defaultLabel: 'Cache', icon: Zap, border: 'border-yellow-400', bg: 'bg-yellow-400/10', text: 'text-yellow-400' },
  queue: { paletteLabel: 'Queue / RabbitMQ', defaultLabel: 'Queue', icon: Radio, border: 'border-pink-400', bg: 'bg-pink-400/10', text: 'text-pink-400' },
  kafka: { paletteLabel: 'Kafka', defaultLabel: 'Kafka', icon: Layers, border: 'border-purple-400', bg: 'bg-purple-400/10', text: 'text-purple-400' },
  cdn: { paletteLabel: 'CDN', defaultLabel: 'CDN', icon: Globe, border: 'border-cyan-400', bg: 'bg-cyan-400/10', text: 'text-cyan-400' },
  'external-api': { paletteLabel: 'External API', defaultLabel: 'External API', icon: LinkIcon, border: 'border-gray-400', bg: 'bg-gray-400/10', text: 'text-gray-400' },
  auth: { paletteLabel: 'Auth Service', defaultLabel: 'Auth', icon: Lock, border: 'border-red-400', bg: 'bg-red-400/10', text: 'text-red-400' },
  storage: { paletteLabel: 'Storage', defaultLabel: 'Storage', icon: HardDrive, border: 'border-teal-400', bg: 'bg-teal-400/10', text: 'text-teal-400' },
};

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

const NODE_SIZE = 80;
const HISTORY_LIMIT = 10;

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
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
  const [components, setComponents] = useState<CanvasComponent[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [mode, setMode] = useState<Mode>('move');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [labelEditValue, setLabelEditValue] = useState('');

  const [pendingLabelId, setPendingLabelId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');

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

  const [showPreTeaching, setShowPreTeaching] = useState(false);
  const [preTeachingLoading, setPreTeachingLoading] = useState(false);
  const [preTeachingError, setPreTeachingError] = useState<string | null>(null);
  const [preTeaching, setPreTeaching] = useState<PreDesignTeaching | null>(null);

  const [weakAreaModalOpen, setWeakAreaModalOpen] = useState(false);
  const [weakAreaLoading, setWeakAreaLoading] = useState(false);
  const [weakAreaError, setWeakAreaError] = useState<string | null>(null);
  const [weakAreaResult, setWeakAreaResult] = useState<WeakAreaSummary | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

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

  function pushHistory() {
    setHistory((prev) => {
      const next = [...prev, { components, connections }];
      return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
    });
  }

  function undo() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setComponents(last.components);
    setConnections(last.connections);
    setHistory((prev) => prev.slice(0, -1));
  }

  function removeComponent(id: string) {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setConnections((prev) => prev.filter((c) => c.from !== id && c.to !== id));
    setSelectedId(null);
  }

  function removeConnection(id: string) {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    setSelectedConnectionId(null);
  }

  function clearCanvas() {
    pushHistory();
    setComponents([]);
    setConnections([]);
    setSelectedId(null);
    setSelectedConnectionId(null);
    setConnectingFrom(null);
  }

  // Reposition drag: track via a ref (not state) so the listener never goes stale.
  useEffect(() => {
    function onMove(e: MouseEvent) {
      const dragState = dragStateRef.current;
      if (!dragState || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(0, e.clientX - rect.left - dragState.offsetX);
      const y = Math.max(0, e.clientY - rect.top - dragState.offsetY);
      setComponents((prev) => prev.map((c) => (c.id === dragState.id ? { ...c, x, y } : c)));
    }
    function onUp() {
      dragStateRef.current = null;
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Keyboard shortcuts: Delete/Backspace, Escape, Ctrl+Z.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          pushHistory();
          removeComponent(selectedId);
        } else if (selectedConnectionId) {
          pushHistory();
          removeConnection(selectedConnectionId);
        }
      } else if (e.key === 'Escape') {
        setConnectingFrom(null);
        setSelectedId(null);
        setSelectedConnectionId(null);
        setPendingLabelId(null);
        setEditingId(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedConnectionId, components, connections, history]);

  function startDrag(comp: CanvasComponent, e: React.MouseEvent) {
    if (!canvasRef.current) return;
    pushHistory();
    const rect = canvasRef.current.getBoundingClientRect();
    dragStateRef.current = {
      id: comp.id,
      offsetX: e.clientX - rect.left - comp.x,
      offsetY: e.clientY - rect.top - comp.y,
    };
    setSelectedId(comp.id);
    setSelectedConnectionId(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer.getData('componentType') as ComponentType;
    if (!canvasRef.current || !COMPONENT_META[type]) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left - NODE_SIZE / 2);
    const y = Math.max(0, e.clientY - rect.top - NODE_SIZE / 2);
    pushHistory();
    const newComp: CanvasComponent = { id: uid(), type, label: COMPONENT_META[type].defaultLabel, x, y };
    setComponents((prev) => [...prev, newComp]);
  }

  function handleCanvasMouseMove(e: React.MouseEvent) {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function handleCanvasBackgroundClick() {
    setSelectedId(null);
    setSelectedConnectionId(null);
  }

  function handleNodeClick(compId: string) {
    if (mode !== 'connect') {
      setSelectedId(compId);
      setSelectedConnectionId(null);
      return;
    }
    if (connectingFrom === null) {
      setConnectingFrom(compId);
    } else if (connectingFrom === compId) {
      setConnectingFrom(null);
    } else {
      pushHistory();
      const newConn: Connection = { id: uid(), from: connectingFrom, to: compId, label: '' };
      setConnections((prev) => [...prev, newConn]);
      setConnectingFrom(null);
      setPendingLabelId(newConn.id);
      setLabelDraft('');
    }
  }

  function startEditLabel(comp: CanvasComponent) {
    setEditingId(comp.id);
    setLabelEditValue(comp.label);
  }

  function commitEditLabel() {
    if (!editingId) return;
    pushHistory();
    const id = editingId;
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, label: labelEditValue.trim() || c.label } : c)));
    setEditingId(null);
  }

  function selectConnection(conn: Connection) {
    setSelectedConnectionId(conn.id);
    setPendingLabelId(null);
    setLabelDraft(conn.label);
    setSelectedId(null);
  }

  function commitConnectionLabel(connId: string) {
    pushHistory();
    setConnections((prev) => prev.map((c) => (c.id === connId ? { ...c, label: labelDraft.trim() } : c)));
    setPendingLabelId(null);
    setSelectedConnectionId(null);
  }

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
    setPreTeaching(null);
    setPreTeachingError(null);
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
      setShowPreTeaching(true);
      setPreTeachingLoading(true);
      try {
        const teaching = await teachBeforeDesign(getState().settings, {
          title: result.title,
          description: result.description,
          focusArea: result.focusArea,
          suggestedComponents: result.suggestedComponents,
          learningGoal: result.learningGoal,
        });
        setPreTeaching(teaching);
      } catch (err) {
        setPreTeachingError(err instanceof Error ? err.message : String(err));
      } finally {
        setPreTeachingLoading(false);
      }
    } catch (err) {
      setChallengeError(err instanceof Error ? err.message : String(err));
    } finally {
      setChallengeLoading(false);
    }
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

  function getCenter(comp: CanvasComponent): { x: number; y: number } {
    return { x: comp.x + NODE_SIZE / 2, y: comp.y + NODE_SIZE / 2 };
  }

  function getMidpoint(conn: Connection): { x: number; y: number } {
    const from = components.find((c) => c.id === conn.from);
    const to = components.find((c) => c.id === conn.to);
    if (!from || !to) return { x: 0, y: 0 };
    const a = getCenter(from);
    const b = getCenter(to);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  const editorConn = connections.find((c) => c.id === (pendingLabelId ?? selectedConnectionId)) ?? null;

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

        {canvasMode === 'guided' && showPreTeaching && activeChallenge ? (
          /* Teaching screen (Guided Practice mode, before the canvas appears) */
          <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">{activeChallenge.title}</h2>

            {preTeachingLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Gemini is preparing your lesson...
              </div>
            ) : (
              <>
                <h3 className="flex items-center gap-2 text-base font-semibold text-primary">
                  <BookOpen className="h-5 w-5" />
                  Before you draw
                </h3>

                {preTeachingError && <p className="text-sm text-danger">{preTeachingError}</p>}

                {preTeaching && (
                  <>
                    <p className="text-sm text-text/90">{preTeaching.lesson}</p>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Key concepts</p>
                      <ul className="space-y-1.5">
                        {preTeaching.componentExplanations.map((c, i) => (
                          <li key={i} className="text-sm text-text/90">
                            <span className="font-semibold">{c.component}:</span> {c.whatItDoes}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs text-text/90">
                      {preTeaching.simpleFlowDiagram}
                    </div>
                  </>
                )}

                <button
                  onClick={() => setShowPreTeaching(false)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  I understand, let me draw it
                </button>
              </>
            )}
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

          {/* Palette */}
          <div className="w-[200px] shrink-0 space-y-1 rounded-xl border border-border bg-surface p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Components</p>
            {COMPONENT_TYPES.map((type) => {
              const meta = COMPONENT_META[type];
              const Icon = meta.icon;
              return (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('componentType', type)}
                  className={`flex cursor-grab items-center gap-2 rounded-lg border p-2 text-sm active:cursor-grabbing ${meta.border} ${meta.bg}`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${meta.text}`} />
                  <span className="truncate text-text/90">{meta.paletteLabel}</span>
                </div>
              );
            })}
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onMouseMove={handleCanvasMouseMove}
            onClick={handleCanvasBackgroundClick}
            className="relative min-h-[600px] flex-1 overflow-hidden rounded-xl border border-border bg-surface"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(148, 163, 184, 0.35) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {components.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center text-sm text-muted">
                Drag components from the left panel onto the canvas. Then draw arrows between them to show how they
                connect.
              </div>
            )}

            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L8,4 L0,8 z" className="fill-muted" />
                </marker>
              </defs>

              {connections.map((conn) => {
                const from = components.find((c) => c.id === conn.from);
                const to = components.find((c) => c.id === conn.to);
                if (!from || !to) return null;
                const a = getCenter(from);
                const b = getCenter(to);
                const mid = getMidpoint(conn);
                const isSelected = selectedConnectionId === conn.id;
                return (
                  <g key={conn.id} style={{ pointerEvents: 'auto' }}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      className={isSelected ? 'stroke-primary' : 'stroke-muted'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      markerEnd="url(#arrowhead)"
                    />
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="transparent"
                      strokeWidth={14}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectConnection(conn);
                      }}
                    />
                    {conn.label && (
                      <text
                        x={mid.x}
                        y={mid.y - 6}
                        textAnchor="middle"
                        className="fill-muted text-[10px]"
                        style={{ pointerEvents: 'none' }}
                      >
                        {conn.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {mode === 'connect' &&
                connectingFrom &&
                mousePos &&
                (() => {
                  const from = components.find((c) => c.id === connectingFrom);
                  if (!from) return null;
                  const a = getCenter(from);
                  return (
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={mousePos.x}
                      y2={mousePos.y}
                      className="stroke-primary"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  );
                })()}
            </svg>

            {components.map((comp) => {
              const meta = COMPONENT_META[comp.type];
              const Icon = meta.icon;
              const isSelected = selectedId === comp.id;
              const isConnecting = connectingFrom === comp.id;
              return (
                <div
                  key={comp.id}
                  className={`group absolute flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-1 text-center ${meta.border} ${meta.bg} ${
                    isSelected || isConnecting ? 'ring-2 ring-primary' : ''
                  } ${mode === 'move' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                  style={{ left: comp.x, top: comp.y, width: NODE_SIZE, height: NODE_SIZE }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (mode === 'move') startDrag(comp, e);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(comp.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEditLabel(comp);
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      pushHistory();
                      removeComponent(comp.id);
                    }}
                    className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-danger text-white group-hover:flex"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <Icon className={`h-6 w-6 ${meta.text}`} />
                  {editingId === comp.id ? (
                    <input
                      autoFocus
                      value={labelEditValue}
                      onChange={(e) => setLabelEditValue(e.target.value)}
                      onBlur={commitEditLabel}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEditLabel();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-16 rounded border border-border bg-surface-2 px-1 text-center text-[10px] outline-none"
                    />
                  ) : (
                    <span className="w-full truncate px-0.5 text-[10px] text-text/90">{comp.label}</span>
                  )}
                </div>
              );
            })}

            {editorConn && (
              <div
                className="absolute z-20 flex items-center gap-1 rounded-lg border border-border bg-surface p-1.5 shadow-lg"
                style={{ left: getMidpoint(editorConn).x, top: getMidpoint(editorConn).y, transform: 'translate(-50%, -50%)' }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <input
                  autoFocus
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  placeholder="Label this connection (optional, e.g. HTTP, publishes event, reads cache)"
                  className="w-64 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitConnectionLabel(editorConn.id);
                    if (e.key === 'Escape') {
                      setPendingLabelId(null);
                      setSelectedConnectionId(null);
                    }
                  }}
                />
                <button
                  onClick={() => commitConnectionLabel(editorConn.id)}
                  className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
                >
                  Save
                </button>
                {selectedConnectionId === editorConn.id && !pendingLabelId && (
                  <button
                    onClick={() => {
                      pushHistory();
                      removeConnection(editorConn.id);
                    }}
                    className="rounded-md bg-danger px-2 py-1 text-xs font-medium text-white"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

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
