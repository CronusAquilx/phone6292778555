import { setPrefs, usePrefs } from "@/lib/astra/prefs";
import type { DesktopApp } from "./window-model";

export const HOME_ESSENTIALS = ["app-store", "store", "app-library"];
export function isHomeApp(layout: string, id: string, overrides: Record<string, boolean> = {}): boolean {
  if (id === "home") return false;
  if (typeof overrides[id] === "boolean") return overrides[id];
  if (HOME_ESSENTIALS.includes(id)) return true;
  if (layout === "macos" || layout === "ipad") return true;
  return ["games", "web", "youtube", "music", "movies", "settings"].includes(id) || id.startsWith("tool:");
}
export function useHomeScreen(layoutOverride?: string) {
  const prefs = usePrefs();
  const layout = layoutOverride ?? prefs.layout;
  const overrides = prefs.homeScreenApps?.[layout] ?? {};
  return {
    has: (id: string) => isHomeApp(layout, id, overrides),
    set: (id: DesktopApp, visible: boolean) => setPrefs({ homeScreenApps: { ...prefs.homeScreenApps, [layout]: { ...overrides, [id]: visible } } }),
  };
}