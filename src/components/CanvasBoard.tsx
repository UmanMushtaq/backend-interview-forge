import { X } from 'lucide-react';
import { COMPONENT_META, NODE_SIZE } from '../lib/canvas';
import type { ComponentType } from '../lib/canvas';
import type { CanvasBoardApi } from '../hooks/useCanvasBoard';

interface Props {
  board: CanvasBoardApi;
  paletteTypes: ComponentType[];
  /** Tailwind min-height class for the canvas drop area, e.g. 'min-h-[600px]'. */
  minHeightClass?: string;
}

/**
 * The reusable drag-and-drop canvas surface: component palette + the canvas
 * itself (nodes, arrows, connection labels). Shared by Design Canvas and
 * Architecture Studio so there is a single canvas engine, not two.
 */
export function CanvasBoard({ board, paletteTypes, minHeightClass = 'min-h-[600px]' }: Props) {
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
