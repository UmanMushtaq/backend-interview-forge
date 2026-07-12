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

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const hasApiKey = getApiKeys(getState().settings).length > 0;
  const effectiveScenario = scenarioChoice === 'custom' ? customScenario.trim() || 'Custom scenario' : scenarioChoice;

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

        {/* Scenario selector */}
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
            onClick={handleReview}
            disabled={!hasApiKey || components.length === 0}
            className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Review Design
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
