import { useId } from 'react';
import { X } from 'lucide-react';
import { COMPONENT_META, NODE_SIZE } from '../lib/canvas';
import type { ComponentType, PresetNode, PresetConnection } from '../lib/canvas';
import type { CanvasBoardApi } from '../hooks/useCanvasBoard';

type InteractiveProps = {
  board: CanvasBoardApi;
  paletteTypes: ComponentType[];
  /** Tailwind min-height class for the canvas drop area, e.g. 'min-h-[600px]'. */
  minHeightClass?: string;
  presetNodes?: undefined;
  presetConnections?: undefined;
};

type PresetProps = {
  /** Hardcoded nodes for a static, read-only diagram. No dragging, no editing, nothing clickable. */
  presetNodes: PresetNode[];
  presetConnections: PresetConnection[];
  /** Tailwind min-height class for the outer scroll wrapper, e.g. 'min-h-[400px]'. */
  minHeightClass?: string;
  board?: undefined;
  paletteTypes?: undefined;
};

type Props = InteractiveProps | PresetProps;

/**
 * The reusable canvas surface. Two modes:
 *  - Interactive (pass `board` + `paletteTypes`): the drag-and-drop engine
 *    shared by Design Canvas and Architecture Studio.
 *  - Preset (pass `presetNodes` + `presetConnections`): a frozen, read-only
 *    diagram rendered from hardcoded data, for embedding in lesson content.
 * Same node boxes, icons, colors, and arrow style in both modes.
 */
export function CanvasBoard(props: Props) {
  if (props.presetNodes) {
    return (
      <PresetCanvas
        nodes={props.presetNodes}
        connections={props.presetConnections}
        minHeightClass={props.minHeightClass}
      />
    );
  }

  const { board, paletteTypes, minHeightClass = 'min-h-[600px]' } = props;
  const {
    components,
    connections,
    mode,
    selectedId,
    selectedConnectionId,
    connectingFrom,
    mousePos,
    editingId,
    setEditingId,
    labelEditValue,
    setLabelEditValue,
    pendingLabelId,
    setPendingLabelId,
    labelDraft,
    setLabelDraft,
    canvasRef,
    editorConn,
    pushHistory,
    removeComponent,
    removeConnection,
    startDrag,
    handleDrop,
    handleCanvasMouseMove,
    handleCanvasBackgroundClick,
    handleNodeClick,
    startEditLabel,
    commitEditLabel,
    selectConnection,
    commitConnectionLabel,
    getCenter,
    getMidpoint,
    setSelectedConnectionId,
  } = board;

  return (
    <div className="flex flex-1 items-start gap-4">
      {/* Palette */}
      <div className="w-[200px] shrink-0 space-y-1 rounded-xl border border-border bg-surface p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Components</p>
        {paletteTypes.map((type) => {
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
        className={`relative ${minHeightClass} flex-1 overflow-hidden rounded-xl border border-border bg-surface`}
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preset (read-only) rendering
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

function nodeCenter(n: PresetNode): Point {
  return { x: n.x + NODE_SIZE / 2, y: n.y + NODE_SIZE / 2 };
}

function bezierPoint(a: Point, ctrl: Point, b: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * a.x + 2 * mt * t * ctrl.x + t * t * b.x,
    y: mt * mt * a.y + 2 * mt * t * ctrl.y + t * t * b.y,
  };
}

/** A point a fixed pixel distance from `from`, along the straight-line direction toward `to`. */
function pointAtDistance(from: Point, to: Point, distance: number): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: from.x + (dx / len) * distance, y: from.y + (dy / len) * distance };
}

/** Unordered pair key so A->B and B->A are treated as the same edge slot for offsetting. */
function edgeKey(a: string, b: string): string {
  return [a, b].sort().join('__');
}

interface PresetPath {
  conn: PresetConnection;
  a: Point;
  b: Point;
  ctrl: Point;
  labelPos: Point;
  stepPos: Point;
}

/** Lays out connection paths, curving apart any pair of nodes with more than one connection between them. */
function layoutPresetPaths(nodes: PresetNode[], connections: PresetConnection[]): PresetPath[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const groups = new Map<string, string[]>();
  for (const c of connections) {
    const key = edgeKey(c.from, c.to);
    const ids = groups.get(key) ?? [];
    ids.push(c.id);
    groups.set(key, ids);
  }

  const paths: PresetPath[] = [];
  for (const conn of connections) {
    const from = byId.get(conn.from);
    const to = byId.get(conn.to);
    if (!from || !to) continue;

    const a = nodeCenter(from);
    const b = nodeCenter(to);
    const group = groups.get(edgeKey(conn.from, conn.to))!;
    const count = group.length;
    const idx = group.indexOf(conn.id);
    const offset = count > 1 ? (idx - (count - 1) / 2) * 30 : 0;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const ctrl = { x: mid.x + nx * offset, y: mid.y + ny * offset };

    paths.push({
      conn,
      a,
      b,
      ctrl,
      labelPos: bezierPoint(a, ctrl, b, 0.5),
      // Fixed pixel distance from the source node's edge, so it clears the node
      // border regardless of how close together the two nodes are.
      stepPos: pointAtDistance(a, b, NODE_SIZE / 2 + 16),
    });
  }
  return paths;
}

function PresetCanvas({
  nodes,
  connections,
  minHeightClass = 'min-h-[300px]',
}: {
  nodes: PresetNode[];
  connections: PresetConnection[];
  minHeightClass?: string;
}) {
  const markerId = useId().replace(/:/g, '');
  const paths = layoutPresetPaths(nodes, connections);

  const contentWidth = Math.max(...nodes.map((n) => n.x), 0) + NODE_SIZE + 60;
  const contentHeight = Math.max(...nodes.map((n) => n.y), 0) + NODE_SIZE + 60;

  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-border bg-surface ${minHeightClass}`}>
      <div
        className="relative"
        style={{
          width: contentWidth,
          height: contentHeight,
          backgroundImage: 'radial-gradient(circle, rgba(148, 163, 184, 0.35) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full" width={contentWidth} height={contentHeight}>
          <defs>
            <marker
              id={`preset-arrowhead-${markerId}`}
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L8,4 L0,8 z" className="fill-muted" />
            </marker>
          </defs>
          {paths.map(({ conn, a, ctrl, b }) => (
            <path
              key={conn.id}
              d={`M ${a.x} ${a.y} Q ${ctrl.x} ${ctrl.y} ${b.x} ${b.y}`}
              className="fill-none stroke-muted"
              strokeWidth={1.5}
              markerEnd={`url(#preset-arrowhead-${markerId})`}
            />
          ))}
        </svg>

        {paths.map(({ conn, labelPos, stepPos }) => (
          <div key={conn.id}>
            {conn.label && (
              <div
                className="absolute z-10 max-w-[170px] -translate-x-1/2 -translate-y-1/2 rounded bg-surface px-1.5 py-0.5 text-center text-[10px] leading-tight text-muted shadow-sm ring-1 ring-border"
                style={{ left: labelPos.x, top: labelPos.y }}
              >
                {conn.label}
              </div>
            )}
            <div
              title={`Step ${conn.step}`}
              className="absolute z-10 flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground"
              style={{ left: stepPos.x, top: stepPos.y }}
            >
              {conn.step}
            </div>
          </div>
        ))}

        {nodes.map((node) => {
          const meta = COMPONENT_META[node.type];
          const Icon = meta.icon;
          const statusRing =
            node.status === 'broken'
              ? 'ring-2 ring-danger'
              : node.status === 'empty'
                ? 'border-dashed opacity-80 ring-2 ring-muted/40'
                : '';
          return (
            <div
              key={node.id}
              className={`absolute flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-1 text-center ${meta.border} ${meta.bg} ${statusRing}`}
              style={{ left: node.x, top: node.y, width: NODE_SIZE, height: NODE_SIZE }}
            >
              {node.status && (
                <div
                  title={node.note}
                  className={`absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white ${
                    node.status === 'broken' ? 'bg-danger' : 'bg-muted'
                  }`}
                >
                  {node.status === 'broken' ? '!' : '×'}
                </div>
              )}
              <Icon className={`h-6 w-6 ${meta.text}`} />
              <span className="w-full truncate px-0.5 text-[10px] text-text/90">{node.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
