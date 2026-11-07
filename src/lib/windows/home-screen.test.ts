import { describe, expect, it } from "vitest";
import { HOME_ESSENTIALS, isHomeApp } from "./home-screen";
import { WEB_APPS, TOOL_APPS } from "./tool-apps";

describe("desktop app library rules", () => {
  it("shows both stores and the library automatically in every desktop layout", () => {
    for (const layout of ["windows", "windows2", "macos", "ipad"]) {
      expect(HOME_ESSENTIALS.filter(id => isHomeApp(layout, id))).toEqual(["app-store", "store", "app-library"]);
    }
  });
  it("removes an owned app from home without changing ownership", () => {
    const owned = ["tool:twitch"];
    expect(owned.filter(id => isHomeApp("windows", id, { "tool:twitch": false }))).toEqual([]);
    expect(owned).toEqual(["tool:twitch"]);
  });
  it("can add apps to home and keeps each layout's visibility separate", () => {
    expect(isHomeApp("windows", "chat", { chat: true })).toBe(true);
    expect(isHomeApp("windows2", "chat", {})).toBe(false);
  });
  it("keeps the web store separate from original downloadable apps", () => {
    expect(WEB_APPS.some(a => a.id === "twitch")).toBe(true);
    expect(TOOL_APPS.some(a => a.id === "twitch")).toBe(false);
    expect(WEB_APPS.filter(a => TOOL_APPS.some(t => t.id === a.id))).toEqual([]);
  });
});