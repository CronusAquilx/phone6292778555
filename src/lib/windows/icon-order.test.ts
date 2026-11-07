import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { applyIconOrder, moveIcon, reconcileIconPlacements, useIconOrder } from "./icon-order";
describe("desktop icon order", () => {
  it("keeps the saved order and appends newly installed apps", () => {
    expect(applyIconOrder(["music", "web", "gone"], ["web", "music", "twitch"])).toEqual(["music", "web", "twitch"]);
  });
  it("moves a dragged icon onto another icon's spot", () => {
    expect(moveIcon(["a", "b", "c", "d"], "a", "c")).toEqual(["b", "c", "a", "d"]);
    expect(moveIcon(["a", "b", "c", "d"], "d", "b")).toEqual(["a", "d", "b", "c"]);
  });
  it("keeps existing coordinates when another app is added", () => {
    expect(reconcileIconPlacements({ music: { x: 250, y: 300 } }, ["music", "twitch"], {}, { x: 600, y: 400 })["music"]).toEqual({ x: 250, y: 300 });
  });
  it("keeps existing coordinates when another app is removed", () => {
    expect(reconcileIconPlacements({ music: { x: 250, y: 300 }, twitch: { x: 900, y: 100 } }, ["music"], {}, { x: 600, y: 400 })).toEqual({ music: { x: 250, y: 300 }, twitch: null });
  });
  it("places a re-added app in the center rather than its old location", () => {
    const removed = reconcileIconPlacements({ twitch: { x: 900, y: 100 } }, [], {}, { x: 600, y: 400 });
    expect(reconcileIconPlacements(removed, ["twitch"], {}, { x: 600, y: 400 })["twitch"]).toEqual({ x: 600, y: 400 });
  });
  it("restores serialized coordinates on returning to the desktop", () => {
    const restored = JSON.parse(JSON.stringify({ music: { x: 432, y: 321 } }));
    expect(reconcileIconPlacements(restored, ["music"], { music: { x: 12, y: 16 } }, { x: 600, y: 400 })["music"]).toEqual({ x: 432, y: 321 });
  });
  it("restores placements after unmount and centers returning apps without moving neighbors", () => {
    localStorage.setItem("birch-icon-placements:test-layout", JSON.stringify({ music: { x: 432, y: 321 }, twitch: { x: 50, y: 70 } }));
    const hook = renderHook(({ ids }) => useIconOrder("test-layout", ids), { initialProps: { ids: ["music", "twitch"] } });
    expect(hook.result.current.bind("music").style.left).toBe(432);
    act(() => hook.rerender({ ids: ["music"] }));
    expect(hook.result.current.bind("music").style.top).toBe(321);
    act(() => hook.rerender({ ids: ["music", "twitch"] }));
    expect(hook.result.current.bind("twitch").style.left).toBe((window.innerWidth - 82) / 2);
    hook.unmount();
    const returning = renderHook(() => useIconOrder("test-layout", ["music", "twitch"]));
    expect(returning.result.current.bind("music").style).toMatchObject({ left: 432, top: 321 });
    returning.unmount();
  });
});
