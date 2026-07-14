import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { COMPONENT_META, NODE_SIZE, uid } from '../lib/canvas';
import type { CanvasComponent, Connection, ComponentType } from '../lib/canvas';

export type CanvasMode = 'move' | 'connect';

interface Snapshot {
  components: CanvasComponent[];
  connections: Connection[];
}

const HISTORY_LIMIT = 10;

export interface UseCanvasBoardOptions {
  initialComponents?: CanvasComponent[];
  initialConnections?: Connection[];
}

/**
 * Encapsulates the drag-and-drop canvas engine (components, connections,
 * move/connect modes, undo history, keyboard shortcuts) shared by every
 * canvas surface in the app (Design Canvas, Architecture Studio).
 */
export function useCanvasBoard(options: UseCanvasBoardOptions = {}) {
  const [components, setComponents] = useState<CanvasComponent[]>(options.initialComponents ?? []);
  const [connections, setConnections] = useState<Connection[]>(options.initialConnections ?? []);
  const [mode, setMode] = useState<CanvasMode>('move');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [labelEditValue, setLabelEditValue] = useState('');

  const [pendingLabelId, setPendingLabelId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

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

  return {
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
    connectingFrom,
    mousePos,
    history,
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
    undo,
    removeComponent,
    removeConnection,
    clearCanvas,
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
  };
}

export type CanvasBoardApi = ReturnType<typeof useCanvasBoard>;
