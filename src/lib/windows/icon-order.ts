import { useEffect, useRef, useState, type PointerEvent, type MouseEvent } from "react";

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

const read = (key: string): string[] => { try { return JSON.parse(localStorage.getItem(`birch-icon-order:${key}`) ?? "[]") as string[]; } catch { return []; } };

/** Drag-to-rearrange desktop/home-screen icons; order is saved per layout on this device. */
export function useIconOrder(key: string, ids: string[]) {
  const [saved, setSaved] = useState<string[]>([]);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const gesture = useRef<{ id: string; x: number; y: number; origin: { x: number; y: number }; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  useEffect(() => {
    setSaved(read(key));
    try { setPositions(JSON.parse(localStorage.getItem(`birch-icon-positions:${key}`) ?? "{}")); } catch { setPositions({}); }
  }, [key]);
  const order = applyIconOrder(saved, ids);
  const bind = (id: string) => ({
    "data-movable-app": id,
    "data-dragging": dragging === id || undefined,
    style: { transform: `translate(${positions[id]?.x ?? 0}px, ${positions[id]?.y ?? 0}px)`, zIndex: dragging === id ? 5 : undefined },
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation(); suppressClick.current = false;
      gesture.current = { id, x: e.clientX, y: e.clientY, origin: positions[id] ?? { x: 0, y: 0 }, moved: false };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const g = gesture.current; if (!g || g.id !== id) return;
      const dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (!g.moved && Math.hypot(dx, dy) < 6) return;
      g.moved = true; suppressClick.current = true; setDragging(id);
      setPositions(current => ({ ...current, [id]: { x: g.origin.x + dx, y: g.origin.y + dy } }));
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const g = gesture.current;
      if (g?.moved) {
        e.preventDefault(); e.stopPropagation();
        const next = { ...positions, [id]: { x: g.origin.x + e.clientX - g.x, y: g.origin.y + e.clientY - g.y } };
        setPositions(next);
        try { localStorage.setItem(`birch-icon-positions:${key}`, JSON.stringify(next)); } catch { /* storage full */ }
      }
      gesture.current = null; setDragging(null);
    },
    onPointerCancel: () => { gesture.current = null; setDragging(null); },
    onClickCapture: (e: MouseEvent) => {
      if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; }
    },
    onDragStart: (e: MouseEvent) => e.preventDefault(),
  });
  return { order, bind };
}
