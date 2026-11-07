import { useState, type DragEvent } from "react";

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
  const [saved, setSaved] = useState<string[]>(() => typeof window === "undefined" ? [] : read(key));
  const [dragging, setDragging] = useState<string | null>(null);
  const order = applyIconOrder(saved, ids);
  const bind = (id: string) => ({
    draggable: true,
    "data-dragging": dragging === id || undefined,
    onDragStart: (e: DragEvent) => { e.stopPropagation(); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", id); setDragging(id); },
    onDragOver: (e: DragEvent) => { if (dragging) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } },
    onDrop: (e: DragEvent) => {
      e.preventDefault(); if (!dragging) return;
      const next = moveIcon(order, dragging, id); setSaved(next); setDragging(null);
      try { localStorage.setItem(`birch-icon-order:${key}`, JSON.stringify(next)); } catch { /* storage full */ }
    },
    onDragEnd: () => setDragging(null),
  });
  return { order, bind };
}
