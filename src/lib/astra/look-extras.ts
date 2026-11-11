/** Extra device-level personalization applied as data attributes on <html>. */
export type LookExtras = {
  cursor: "default" | "large" | "pointer-dot";
  saturation: number; // 50-150
  contrast: "normal" | "high";
  grayscale: boolean;
  scrollbars: "normal" | "thin" | "hidden";
  letterSpacing: number; // -1..3 (px*0.25)
  textShadow: boolean;
  selection: "accent" | "pink" | "lime" | "orange";
  animationSpeed: "slow" | "normal" | "fast";
  smoothMode: boolean;
  focusRing: "normal" | "bold";
  boldText: boolean;
};
export const DEFAULT_EXTRAS: LookExtras = { cursor: "default", saturation: 100, contrast: "normal", grayscale: false, scrollbars: "normal", letterSpacing: 0, textShadow: false, selection: "accent", animationSpeed: "normal", smoothMode: false, focusRing: "normal", boldText: false };
const KEY = "birch-look-extras";
export function loadExtras(): LookExtras {
  try { return { ...DEFAULT_EXTRAS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return DEFAULT_EXTRAS; }
}
export function applyExtras(x: LookExtras) {
  const r = document.documentElement;
  r.dataset["cursor"] = x.cursor; r.dataset["contrast"] = x.contrast; r.dataset["scrollbars"] = x.scrollbars;
  r.dataset["textShadow"] = x.textShadow ? "on" : "off"; r.dataset["selection"] = x.selection;
  r.dataset["animSpeed"] = x.animationSpeed; r.dataset["smooth"] = x.smoothMode ? "on" : "off";
  r.dataset["focusRing"] = x.focusRing; r.dataset["boldText"] = x.boldText ? "on" : "off";
  const filters = [x.saturation !== 100 ? `saturate(${x.saturation}%)` : "", x.grayscale ? "grayscale(1)" : "", x.contrast === "high" ? "contrast(1.15)" : ""].filter(Boolean).join(" ");
  r.style.setProperty("--extras-filter", filters || "none"); r.dataset["extrasFilter"] = filters ? "on" : "off";
  r.style.setProperty("--extras-letter", `${x.letterSpacing * 0.25}px`);
}
export function saveExtras(x: LookExtras) { try { localStorage.setItem(KEY, JSON.stringify(x)); } catch { /* storage off */ } applyExtras(x); }
