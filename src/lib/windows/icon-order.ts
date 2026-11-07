import { useLayoutEffect, useRef, useState, type PointerEvent, type MouseEvent, type CSSProperties } from "react";

/** Saved order first (only ids that still exist), then any new ids in their default order. */
export function applyIconOrder(saved: string[], ids: string[]): string[] {
  const known = saved.filter(id => ids.includes(id));
  return [...known, ...ids.filter(id => !known.includes(id))];
}
/** Moves `from` to the slot occupied by `to`. */
export function moveIcon(order: string[], from: string, to: string): string[] {
  if (from === to || !order.includes(from) || !order.includes(to)) return order;
  const rest = order.filter(id => id !== from);
  rest.splice(rest.indexOf(to) + (order.indexOf(from) < order.indexOf(to) ? 1 : 0), 0, from);
  return rest;
}

type Point = { x: number; y: number };
export type IconPlacements = Record<string, Point | null>;
export function reconcileIconPlacements(saved: IconPlacements, ids: string[], initial: Record<string, Point>, center: Point): IconPlacements {
  const next = { ...saved };
  for (const id of Object.keys(next)) if (!ids.includes(id)) next[id] = null;
  for (const id of ids) {
    if (saved[id]) continue;
    next[id] = id in saved || Object.keys(saved).length > 0 ? { ...center } : initial[id] ?? { ...center };
  }
  return next;
}
const read = <T,>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) ?? "null") as T ?? fallback; } catch { return fallback; } };
const write = (key: string, value: unknown) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* device storage unavailable */ } };

/** Fixed screen coordinates avoid grid reflow moving other apps on add/remove. */
export function useIconOrder(key: string, ids: string[]) {
  const [saved, setSaved] = useState<string[]>([]);
  const [positions, setPositions] = useState<IconPlacements>({});
  const nodes = useRef(new Map<string, HTMLElement>());
  const sizes = useRef<Record<string, { width: number; height: number }>>({});
  const latest = useRef<IconPlacements>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const gesture = useRef<{ id: string; x: number; y: number; origin: Point; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const signature = JSON.stringify(ids);
  const storageKey = `birch-icon-placements:${key}`;
  useLayoutEffect(() => {
    setSaved(read<string[]>(`birch-icon-order:${key}`, []));
    const stored = read<IconPlacements>(storageKey, {});
    const legacy = read<Record<string, Point>>(`birch-icon-positions:${key}`, {});
    const initial: Record<string, Point> = {};
    for (const id of ids) {
      const rect = nodes.current.get(id)?.getBoundingClientRect();
      if (rect) {
        initial[id] = { x: rect.left + (legacy[id]?.x ?? 0), y: rect.top + (legacy[id]?.y ?? 0) };
        sizes.current[id] = { width: rect.width, height: rect.height };
      }
    }
    const firstNode = nodes.current.values().next().value as HTMLElement | undefined;
    const rect = firstNode?.getBoundingClientRect();
    const center = { x: (window.innerWidth - (rect?.width ?? 82)) / 2, y: (window.innerHeight - (rect?.height ?? 82)) / 2 };
    const next = reconcileIconPlacements(stored, ids, initial, center);
    latest.current = next; setPositions(next); write(storageKey, next);
  }, [key, signature]);
  const order = applyIconOrder(saved, ids);
  const bind = (id: string) => ({
    ref: (node: HTMLElement | null) => { if (node) nodes.current.set(id, node); else nodes.current.delete(id); },
    "data-movable-app": id,
    "data-dragging": dragging === id || undefined,
    style: { ...(positions[id] ? { position: "fixed", left: positions[id]?.x, top: positions[id]?.y, width: sizes.current[id]?.width, height: sizes.current[id]?.height, margin: 0 } : {}), touchAction: "none", zIndex: dragging === id ? 5 : undefined } as CSSProperties,
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation(); suppressClick.current = false;
      const rect = e.currentTarget.getBoundingClientRect();
      gesture.current = { id, x: e.clientX, y: e.clientY, origin: latest.current[id] ?? { x: rect.left, y: rect.top }, moved: false };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const g = gesture.current; if (!g || g.id !== id) return;
      const dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (!g.moved && Math.hypot(dx, dy) < 6) return;
      g.moved = true; suppressClick.current = true; setDragging(id);
      const rect = e.currentTarget.getBoundingClientRect();
      const next = { ...latest.current, [id]: { x: Math.max(0, Math.min(window.innerWidth - rect.width, g.origin.x + dx)), y: Math.max(0, Math.min(window.innerHeight - rect.height, g.origin.y + dy)) } };
      latest.current = next; setPositions(next);
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const g = gesture.current;
      if (g?.moved) {
        e.preventDefault(); e.stopPropagation();
        write(storageKey, latest.current);
      }
      gesture.current = null; setDragging(null);
    },
    onPointerCancel: () => { write(storageKey, latest.current); gesture.current = null; setDragging(null); },
    onClickCapture: (e: MouseEvent) => {
      if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; }
    },
    onDragStart: (e: MouseEvent) => e.preventDefault(),
  });
  return { order, bind };
}
