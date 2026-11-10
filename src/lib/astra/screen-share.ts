/** Lightweight screen sharing: sends a layout outline (boxes, text, image links) instead of rendering pixels, so the shared tab stays fast. */
export type ScreenItem = { x: number; y: number; w: number; h: number; bg?: string; c?: string; fs?: number; fw?: number; r?: string; t?: string; img?: string; media?: boolean; bd?: string; icon?: boolean };
export type ScreenFrame = { w: number; h: number; path: string; bg: string; shot?: string; items: ScreenItem[]; mediaOnly?: boolean; entireScreen?: boolean };
export type ControlEvent = { type: "click"; x: number; y: number } | { type: "type"; text: string } | { type: "key"; key: string } | { type: "scroll"; x: number; y: number; dy: number };

const MAX_ITEMS = 650;
const transparent = (v: string) => !v || v === "transparent" || v === "rgba(0, 0, 0, 0)";

const MAX_MEDIA = 3;
const SHOT_W = 960;
let shotCanvas: HTMLCanvasElement | null = null;

/** Picks the drawable source for a media element; same-origin iframes (arcade, proxied pages) expose their biggest canvas/video. */
function drawable(el: HTMLElement): HTMLVideoElement | HTMLCanvasElement | null {
  if (el instanceof HTMLVideoElement) return el.readyState >= 2 ? el : null;
  if (el instanceof HTMLCanvasElement) return el;
  if (el instanceof HTMLIFrameElement) {
    try {
      const doc = el.contentDocument; if (!doc) return null;
      let best: HTMLVideoElement | HTMLCanvasElement | null = null, area = 0;
      doc.querySelectorAll("canvas,video").forEach((n) => {
        const a = (n as HTMLElement).clientWidth * (n as HTMLElement).clientHeight;
        if (a > area) { area = a; best = n as HTMLVideoElement | HTMLCanvasElement; }
      });
      return best;
    } catch { return null; }
  }
  return null;
}

/** Tiny low-quality JPEG of a video/game so the viewer sees it without slowing the shared tab. */
function snapshotMedia(el: HTMLElement): string | undefined {
  const src = drawable(el); if (!src) return undefined;
  const sw = src instanceof HTMLVideoElement ? src.videoWidth : src.width;
  const sh = src instanceof HTMLVideoElement ? src.videoHeight : src.height;
  if (!sw || !sh) return undefined;
  try {
    shotCanvas ??= document.createElement("canvas");
    shotCanvas.width = Math.min(SHOT_W, sw); shotCanvas.height = Math.round(shotCanvas.width * sh / sw);
    const context = shotCanvas.getContext("2d");
    if (!context) return undefined;
    context.drawImage(src, 0, 0, shotCanvas.width, shotCanvas.height);
    return shotCanvas.toDataURL("image/jpeg", 0.78);
  } catch { return undefined; } // cross-origin pixels can't be read
}

let mediaShots = 0;
let svgChars = 0;
const svgCache = new Map<string, string>();
/** Icons are sent as tiny SVG image links (inert in an <img>, so nothing in them can run on the viewer's side). */
function svgImage(el: SVGSVGElement, color: string): string | undefined {
  const raw = el.outerHTML;
  if (raw.length > 4000 || svgChars > 80_000) return undefined;
  const key = raw + color;
  let url = svgCache.get(key);
  if (!url) {
    let s = raw.replace(/currentColor/g, color);
    if (!s.includes("xmlns=")) s = s.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    url = "data:image/svg+xml," + encodeURIComponent(s);
    if (svgCache.size > 400) svgCache.clear();
    svgCache.set(key, url);
  }
  svgChars += url.length;
  return url;
}

export function captureFrame(doc: Document = document, depth = 0): ScreenFrame {
  mediaShots = 0; svgChars = 0;
  const win = doc.defaultView;
  const w = win?.innerWidth ?? window.innerWidth, h = win?.innerHeight ?? window.innerHeight;
  const items: ScreenItem[] = [];
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  let el = walker.nextNode() as HTMLElement | null;
  while (el && items.length < MAX_ITEMS) {
    if (el.dataset?.["screenShare"] === "skip") { el = nextOutside(walker, el); continue; }
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.right < 0 || r.top > h || r.left > w) {
      // Offscreen/collapsed: children of a zero box can still overflow, so only skip subtrees for hidden ones.
      if (r.width === 0 && r.height === 0 && el.childElementCount === 0) { el = nextOutside(walker, el); continue; }
      el = walker.nextNode() as HTMLElement | null; continue;
    }
    const tag = el.tagName;
    const item: ScreenItem = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
    if (tag === "IFRAME" && depth < 3) {
      const embedded = captureEmbeddedOutline(el as HTMLIFrameElement, depth);
      if (embedded.length) { items.push(...embedded.slice(0, MAX_ITEMS - items.length)); el = nextOutside(walker, el); continue; }
    }
    if (tag === "VIDEO" || tag === "IFRAME" || tag === "CANVAS" || tag === "EMBED" || tag === "OBJECT") {
      const shot = mediaShots < MAX_MEDIA ? snapshotMedia(el) : undefined;
      if (shot) mediaShots++;
      items.push({ ...item, media: true, ...(shot ? { img: shot } : {}) }); el = nextOutside(walker, el); continue;
    }
    const cs = win?.getComputedStyle(el) ?? getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.opacity === "0" || cs.display === "none") { el = nextOutside(walker, el); continue; }
    if (tag.toLowerCase() === "svg") {
      const icon = svgImage(el as unknown as SVGSVGElement, cs.color);
      if (icon) items.push({ ...item, img: icon, icon: true });
      el = nextOutside(walker, el); continue;
    }
    let keep = false;
    const bgi = cs.backgroundImage;
    if (bgi && bgi !== "none" && tag !== "BODY") { const m = /url\("?(https?:[^")]+)"?\)/.exec(bgi); if (m?.[1] && m[1].length < 600) { item.img = m[1]; keep = true; } }
    if (!transparent(cs.backgroundColor)) { item.bg = cs.backgroundColor; keep = true; }
    if (cs.borderTopWidth !== "0px" && !transparent(cs.borderTopColor) && r.width < w) { item.bd = cs.borderTopColor; keep = true; }
    if (tag === "IMG") { const src = (el as HTMLImageElement).currentSrc; if (src && !src.startsWith("blob:") && src.length < 600) { item.img = src; keep = true; } }
    let text = "";
    for (const n of el.childNodes) if (n.nodeType === 3) text += n.textContent;
    text = text.replace(/\s+/g, " ").trim();
    if (!text && (tag === "INPUT" || tag === "TEXTAREA")) text = (el as HTMLInputElement).type === "password" ? "••••" : (el as HTMLInputElement).value || (el as HTMLInputElement).placeholder;
    if (text) { item.t = text.slice(0, 120); item.c = cs.color; item.fs = Math.round(parseFloat(cs.fontSize)); item.fw = Number(cs.fontWeight) || 400; keep = true; }
    if (keep) { if (cs.borderRadius !== "0px") item.r = cs.borderRadius; items.push(item); }
    el = walker.nextNode() as HTMLElement | null;
  }
  return { w, h, path: location.pathname, bg: win?.getComputedStyle(doc.body).backgroundColor ?? getComputedStyle(doc.body).backgroundColor, items };
}

/** Browser-accessible frame documents only; protected cross-origin surfaces remain protected. */
function captureEmbeddedOutline(el: HTMLIFrameElement, depth = 0): ScreenItem[] {
  try {
    const doc = el.contentDocument;
    if (!doc?.body || !doc.defaultView || depth >= 3) return [];
    const bounds = el.getBoundingClientRect();
    const frame = captureFrame(doc, depth + 1);
    const sx = bounds.width / Math.max(1, frame.w), sy = bounds.height / Math.max(1, frame.h);
    return frame.items.filter((item) => item.x >= 0 && item.y >= 0 && item.x < frame.w && item.y < frame.h).map((item) => ({
      ...item, x: Math.round(bounds.left + item.x * sx), y: Math.round(bounds.top + item.y * sy),
      w: Math.round(Math.min(item.w, frame.w - item.x) * sx), h: Math.round(Math.min(item.h, frame.h - item.y) * sy),
      ...(item.fs ? { fs: Math.round(item.fs * sy) } : {}), media: true,
    }));
  } catch { return []; }
}

let captureWarningShown = false;

/** Only the media layers need a second pass after a successful picture; avoid walking/styling the whole DOM. */
function captureMediaItems(frame: Pick<ScreenFrame, "w" | "h">): ScreenItem[] {
  mediaShots = 0;
  const items: ScreenItem[] = [];
  let surfaces = 0;
  for (const el of document.body.querySelectorAll<HTMLElement>("video,iframe,canvas,embed,object")) {
    if (surfaces >= MAX_MEDIA || el.closest("[data-screen-share='skip']")) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.right < 0 || r.top > frame.h || r.left > frame.w) continue;
    const item: ScreenItem = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), media: true };
    const shot = snapshotMedia(el);
    surfaces++;
    if (!shot && el instanceof HTMLIFrameElement) {
      const outline = captureEmbeddedOutline(el);
      if (outline.length) { items.push(...outline.slice(0, MAX_ITEMS - items.length)); continue; }
    }
    if (shot) { item.img = shot; mediaShots++; }
    items.push(item);
  }
  return items;
}

/** Backs off when captures are expensive so screen viewing never competes with the visitor's own interactions. */
export function nextCaptureDelay(captureMs: number): number {
  if (!Number.isFinite(captureMs) || captureMs < 0) return 6000;
  return Math.min(8000, Math.max(2200, Math.round(captureMs * 12)));
}

/** Cheap updates for animated media; the viewer keeps the last full picture underneath. */
export function captureMediaFrame(): ScreenFrame {
  const w = window.innerWidth, h = window.innerHeight;
  const base = { w, h, path: location.pathname, bg: getComputedStyle(document.body).backgroundColor };
  return { ...base, items: captureMediaItems(base), mediaOnly: true };
}

/** Capture actual rendered pixels first; only pay for the full DOM outline when pixels are unavailable. */
export async function captureLiveFrame(): Promise<ScreenFrame> {
  const w = window.innerWidth, h = window.innerHeight;
  const base = { w, h, path: location.pathname, bg: getComputedStyle(document.body).backgroundColor };
  try {
    const { toJpeg } = await import("html-to-image");
    for (const [width, quality] of [[1120, 0.72], [860, 0.52]] as const) {
      const shot = await toJpeg(document.body, {
        canvasWidth: width,
        canvasHeight: Math.round(width * h / w),
        quality,
        backgroundColor: base.bg,
        skipFonts: true,
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true;
          if (node.dataset["screenShare"] === "skip") return false;
          return !["IFRAME", "VIDEO", "EMBED", "OBJECT"].includes(node.tagName);
        },
      });
      // A smaller retry protects the realtime message limit on busy desktops.
      if (shot.length < 235_000) return { ...base, shot, items: captureMediaItems(base) };
    }
  } catch (error) {
    if (!captureWarningShown) {
      captureWarningShown = true;
      console.warn("Screen picture unavailable; using layout fallback", error);
    }
  }
  return captureFrame();
}

function nextOutside(walker: TreeWalker, el: HTMLElement) {
  let n: Node | null = el;
  while (n && n !== walker.root) { const s: Node | null = n.nextSibling; if (s) { walker.currentNode = s; return (s.nodeType === 1 ? s : walker.nextNode()) as HTMLElement | null; } n = n.parentNode; }
  return null;
}

let lastPoint = { x: 0, y: 0 };
/** Applies a developer's remote input to this tab. */
export function applyControl(ev: ControlEvent) {
  if (ev.type === "click") {
    lastPoint = { x: ev.x, y: ev.y };
    const target = document.elementFromPoint(ev.x, ev.y) as HTMLElement | null;
    if (!target || target.closest("[data-screen-share='skip']")) return;
    const opts = { bubbles: true, cancelable: true, clientX: ev.x, clientY: ev.y, view: window };
    target.dispatchEvent(new PointerEvent("pointerdown", opts));
    target.dispatchEvent(new MouseEvent("mousedown", opts));
    target.dispatchEvent(new PointerEvent("pointerup", opts));
    target.dispatchEvent(new MouseEvent("mouseup", opts));
    target.focus?.();
    target.click();
  } else if (ev.type === "type") {
    const a = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
    if (!a || !("value" in a)) return;
    const proto = a instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(a, a.value + ev.text.slice(0, 500));
    a.dispatchEvent(new Event("input", { bubbles: true }));
  } else if (ev.type === "key") {
    const a = (document.activeElement as HTMLElement | null) ?? document.body;
    if (ev.key === "Backspace" && "value" in a) {
      const i = a as HTMLInputElement;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(i, i.value.slice(0, -1));
      i.dispatchEvent(new Event("input", { bubbles: true }));
    }
    a.dispatchEvent(new KeyboardEvent("keydown", { key: ev.key, bubbles: true, cancelable: true }));
    a.dispatchEvent(new KeyboardEvent("keyup", { key: ev.key, bubbles: true }));
    if (ev.key === "Enter" && a instanceof HTMLInputElement) a.form?.requestSubmit();
  } else if (ev.type === "scroll") {
    let n = document.elementFromPoint(ev.x || lastPoint.x, ev.y || lastPoint.y) as HTMLElement | null;
    while (n && n !== document.body) { const s = getComputedStyle(n).overflowY; if ((s === "auto" || s === "scroll") && n.scrollHeight > n.clientHeight) break; n = n.parentElement; }
    (n && n !== document.body ? n : document.scrollingElement ?? document.body).scrollBy({ top: ev.dy });
  }
}
