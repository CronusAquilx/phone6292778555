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
  brightness: number; // 70-130
  warmth: number; // 0-60 sepia
  hueShift: number; // 0-360
  fontFamily: "default" | "serif" | "mono" | "rounded" | "handwritten";
  lineHeight: "tight" | "normal" | "loose";
  wordSpacing: number; // 0-4
  underlineLinks: boolean;
  uppercaseHeadings: boolean;
  roundImages: boolean;
  caret: "accent" | "thick" | "default";
  imageStyle: "normal" | "vivid" | "soft";
  buttonStyle: "default" | "pill" | "square";
  shadows: "normal" | "none" | "deep";
  borders: "normal" | "thick" | "none";
  textAlign: "default" | "center";
};
export const DEFAULT_EXTRAS: LookExtras = { cursor: "default", saturation: 100, contrast: "normal", grayscale: false, scrollbars: "normal", letterSpacing: 0, textShadow: false, selection: "accent", animationSpeed: "normal", smoothMode: false, focusRing: "normal", boldText: false, brightness: 100, warmth: 0, hueShift: 0, fontFamily: "default", lineHeight: "normal", wordSpacing: 0, underlineLinks: false, uppercaseHeadings: false, roundImages: false, caret: "default", imageStyle: "normal", buttonStyle: "default", shadows: "normal", borders: "normal", textAlign: "default" };
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
  r.dataset["font"] = x.fontFamily; r.dataset["lineHeight"] = x.lineHeight; r.dataset["underline"] = x.underlineLinks ? "on" : "off";
  r.dataset["upperHeadings"] = x.uppercaseHeadings ? "on" : "off"; r.dataset["roundImages"] = x.roundImages ? "on" : "off"; r.dataset["caret"] = x.caret;
  r.dataset["imageStyle"] = x.imageStyle; r.dataset["buttonStyle"] = x.buttonStyle; r.dataset["shadows"] = x.shadows; r.dataset["borders"] = x.borders; r.dataset["textAlign"] = x.textAlign;
  r.style.setProperty("--extras-word", `${x.wordSpacing * 0.1}em`);
  const filters = [x.brightness !== 100 ? `brightness(${x.brightness}%)` : "", x.warmth ? `sepia(${x.warmth}%)` : "", x.hueShift ? `hue-rotate(${x.hueShift}deg)` : "", x.saturation !== 100 ? `saturate(${x.saturation}%)` : "", x.grayscale ? "grayscale(1)" : "", x.contrast === "high" ? "contrast(1.15)" : ""].filter(Boolean).join(" ");
  r.style.setProperty("--extras-filter", filters || "none"); r.dataset["extrasFilter"] = filters ? "on" : "off";
  r.style.setProperty("--extras-letter", `${x.letterSpacing * 0.25}px`);
}
export function saveExtras(x: LookExtras) { try { localStorage.setItem(KEY, JSON.stringify(x)); } catch { /* storage off */ } applyExtras(x); }
