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
  CheckCircle2,
  Circle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getState } from '../lib/storage';
import { getApiKeys, reviewSystemDesign } from '../lib/gemini';
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
type ChallengeDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface GuidedChallenge {
  id: string;
  level: number;
  title: string;
  difficulty: ChallengeDifficulty;
  description: string;
  requiredComponents: ComponentType[];
  hints: string[];
  minConnections: number;
}

const GUIDED_CHALLENGES: GuidedChallenge[] = [
  {
    id: 'gc-1',
    level: 1,
    title: 'A single server',
    difficulty: 'Beginner',
    description:
      'Draw the simplest possible web system: a browser making a request to a server, which reads from a database. This is where everything starts.',
    requiredComponents: ['client', 'service', 'database'],
    hints: [
      'Start with a Client on the left',
      'Add a Service (your backend) in the middle',
      'Add a Database on the right',
      'Draw arrows showing the request flow',
    ],
    minConnections: 2,
  },
  {
    id: 'gc-2',
    level: 2,
    title: 'Add a cache',
    difficulty: 'Beginner',
    description:
      'Your API is slow because every request hits the database. Add a Redis cache between your service and database to speed up reads.',
    requiredComponents: ['client', 'service', 'cache', 'database'],
    hints: [
      'Add a Cache between your Service and Database',
      'The Service checks the cache first, then the database on a miss',
    ],
    minConnections: 3,
  },
  {
    id: 'gc-3',
    level: 3,
    title: 'Handle more traffic',
    difficulty: 'Beginner',
    description:
      'Your one server cannot handle the load. Add a load balancer and a second service instance to distribute traffic.',
    requiredComponents: ['client', 'load-balancer', 'service', 'service', 'database'],
    hints: [
      'Add a Load Balancer between the Client and your Services',
      'Add two Service boxes to show multiple instances',
      'Both services share the same database',
    ],
    minConnections: 4,
  },
  {
    id: 'gc-4',
    level: 4,
    title: 'Add an API Gateway',
    difficulty: 'Beginner',
    description:
      'Add an API Gateway as the single entry point. It handles auth and rate limiting before requests reach your services.',
    requiredComponents: ['client', 'api-gateway', 'load-balancer', 'service', 'database'],
    hints: [
      'The API Gateway sits between the Client and the Load Balancer',
      'Label the connection from Client to Gateway as "HTTPS"',
      'Label the arrow from Gateway as "validated request"',
    ],
    minConnections: 4,
  },
  {
    id: 'gc-5',
    level: 5,
    title: 'Make it async',
    difficulty: 'Intermediate',
    description:
      'Your service needs to send a welcome email when a user registers. This should not slow down the registration response. Add a message queue to handle it asynchronously.',
    requiredComponents: ['client', 'api-gateway', 'service', 'database', 'queue'],
    hints: [
      'The Service publishes to the Queue after saving to the database',
      'A separate worker (another Service box) consumes from the Queue',
      'Label the queue connection as "user.registered"',
    ],
    minConnections: 5,
  },
  {
    id: 'gc-6',
    level: 6,
    title: 'Design a URL shortener',
    difficulty: 'Intermediate',
    description:
      'Design bit.ly. A user submits a long URL and gets a short code. Anyone visiting the short code gets redirected. Optimise for redirects which outnumber creates 1000 to 1.',
    requiredComponents: ['client', 'api-gateway', 'service', 'cache', 'database'],
    hints: [
      'Cache the short code to URL mapping in Redis',
      'Cache hit = instant redirect, no database call',
      'Cache miss = database lookup, then populate cache',
    ],
    minConnections: 5,
  },
  {
    id: 'gc-7',
    level: 7,
    title: 'Design a notification system',
    difficulty: 'Intermediate',
    description:
      'Design a system that sends notifications across email, SMS, and push. It must handle 10 million notifications per day without dropping any.',
    requiredComponents: ['service', 'queue', 'service', 'external-api', 'database'],
    hints: [
      'Any service publishes notification events to a queue',
      'A Notification Service consumes events and routes to providers',
      'External API boxes represent email (SendGrid) and SMS (Twilio) providers',
      'Log every send attempt to the database',
    ],
    minConnections: 6,
  },
  {
    id: 'gc-8',
    level: 8,
    title: 'Design NexusPay transfers',
    difficulty: 'Advanced',
    description:
      'Design the payment transfer system you built. A user sends money to another user. The system must never lose money, never double-charge, and recover from partial failures.',
    requiredComponents: ['client', 'api-gateway', 'service', 'cache', 'queue', 'database', 'kafka'],
    hints: [
      'Use Redis (Cache) for the distributed lock on the wallet',
      'Use RabbitMQ (Queue) for the Saga steps between services',
      'Use Kafka for publishing completed transactions to analytics',
      'Show the compensation flow: what happens if the credit step fails',
    ],
    minConnections: 8,
  },
  {
    id: 'gc-9',
    level: 9,
    title: 'Design WhatsApp messaging',
    difficulty: 'Advanced',
    description:
      'Design the core messaging feature of WhatsApp. Users send messages to other users. Messages must be delivered even if the recipient is offline. Support 1 billion users.',
    requiredComponents: ['client', 'api-gateway', 'load-balancer', 'service', 'queue', 'database', 'cache'],
    hints: [
      'WebSocket connections keep users online',
      'If recipient is offline, store the message and push when they reconnect',
      'Shard the message database by user ID',
      'Cache the last N messages per conversation in Redis',
    ],
    minConnections: 7,
  },
  {
    id: 'gc-10',
    level: 10,
    title: 'Design Twitter timeline',
    difficulty: 'Advanced',
    description:
      'Design the Twitter home timeline. When a user opens Twitter, they see tweets from everyone they follow, ordered by time. Design for 100 million active users.',
    requiredComponents: ['client', 'api-gateway', 'load-balancer', 'service', 'cache', 'database', 'kafka'],
    hints: [
      'Fan-out on write: when someone tweets, push to all followers timelines in Redis',
      'Fan-out on read: fetch from each followed user at read time (for users with millions of followers)',
      'Kafka streams new tweets to the fan-out workers',
      'Cache timelines in Redis, not the database',
    ],
    minConnections: 8,
  },
];

const GUIDED_PROGRESS_KEY = 'design-canvas-progress';

function loadGuidedProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(GUIDED_PROGRESS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveGuidedProgress(ids: Set<string>): void {
  localStorage.setItem(GUIDED_PROGRESS_KEY, JSON.stringify([...ids]));
}

function difficultyBadgeClasses(difficulty: ChallengeDifficulty): string {
  if (difficulty === 'Beginner') return 'rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success';
  if (difficulty === 'Intermediate') return 'rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning';
  return 'rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-semibold text-danger';
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
  const [guidedProgress, setGuidedProgress] = useState<Set<string>>(() => loadGuidedProgress());
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(GUIDED_CHALLENGES[0].id);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const hasApiKey = getApiKeys(getState().settings).length > 0;
  const effectiveScenario = scenarioChoice === 'custom' ? customScenario.trim() || 'Custom scenario' : scenarioChoice;

  const currentChallengeIndex = GUIDED_CHALLENGES.findIndex((c) => c.id === selectedChallengeId);
  const currentChallenge = currentChallengeIndex >= 0 ? GUIDED_CHALLENGES[currentChallengeIndex] : null;
  const allChallengesComplete = GUIDED_CHALLENGES.every((c) => guidedProgress.has(c.id));

  function isChallengeUnlocked(index: number): boolean {
    if (index === 0) return true;
    return guidedProgress.has(GUIDED_CHALLENGES[index - 1].id);
  }

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

  async function handleSubmitGuided() {
    if (!hasApiKey || !currentChallenge || components.length === 0) return;
    setReviewOpen(true);
    setReviewLoading(true);
    setReviewError(null);
    setReviewResult(null);
    try {
      const result = await reviewSystemDesign(
        getState().settings,
        currentChallenge.description,
        components.map((c) => ({ id: c.id, type: c.type, label: c.label })),
        connections.map((c) => ({ from: c.from, to: c.to, label: c.label })),
      );
      setReviewResult(result);
      if (result.overallScore >= 6 && connections.length >= currentChallenge.minConnections) {
        setGuidedProgress((prev) => {
          const next = new Set(prev).add(currentChallenge.id);
          saveGuidedProgress(next);
          return next;
        });
      }
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setReviewLoading(false);
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
          /* Guided challenge list + detail */
          <div className="flex items-start gap-4">
            <div className="w-[220px] shrink-0 space-y-1 rounded-xl border border-border bg-surface p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Challenges</p>
              {GUIDED_CHALLENGES.map((c, i) => {
                const unlocked = isChallengeUnlocked(i);
                const completed = guidedProgress.has(c.id);
                const isSelected = c.id === selectedChallengeId;
                return (
                  <button
                    key={c.id}
                    disabled={!unlocked}
                    onClick={() => unlocked && setSelectedChallengeId(c.id)}
                    className={`flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs transition ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-transparent'
                    } ${unlocked ? 'hover:bg-surface-2' : 'cursor-not-allowed opacity-50'}`}
                  >
                    <span className="w-4 shrink-0 text-center text-muted">{c.level}</span>
                    {completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                    ) : unlocked ? (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-muted/40" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-muted/40" />
                    )}
                    <span className="flex-1 truncate">{c.title}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 space-y-2 rounded-xl border border-border bg-surface p-4">
              {allChallengesComplete ? (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                  <h2 className="text-lg font-semibold">You completed the full guided practice path.</h2>
                  <p className="text-sm text-muted">From a single server to a Twitter-scale timeline. Nice work.</p>
                </div>
              ) : (
                currentChallenge && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={difficultyBadgeClasses(currentChallenge.difficulty)}>
                        {currentChallenge.difficulty}
                      </span>
                      <h2 className="text-lg font-semibold">
                        Level {currentChallenge.level}: {currentChallenge.title}
                      </h2>
                    </div>
                    <p className="text-sm text-text/90">{currentChallenge.description}</p>
                    <details className="rounded-lg border border-border p-2">
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-primary">
                        Show hints
                      </summary>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-text/90">
                        {currentChallenge.hints.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </details>
                  </>
                )
              )}
            </div>
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
            disabled={!hasApiKey || components.length === 0 || (canvasMode === 'guided' && !currentChallenge)}
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

        {/* Palette + canvas + review panel */}
        <div className="flex items-start gap-4">
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

          {/* Review panel */}
          {reviewOpen && (
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
        </div>
      </div>
    </div>
  );
}
