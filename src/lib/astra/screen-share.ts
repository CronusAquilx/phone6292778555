/** Lightweight screen sharing: sends a layout outline (boxes, text, image links) instead of rendering pixels, so the shared tab stays fast. */
export type ScreenItem = { x: number; y: number; w: number; h: number; bg?: string; c?: string; fs?: number; fw?: number; r?: string; t?: string; img?: string; media?: boolean; bd?: string; icon?: boolean; sub?: boolean };
export type ScreenFrame = { w: number; h: number; path: string; bg: string; shot?: string; items: ScreenItem[]; mediaOnly?: boolean; screen?: boolean };
export type ControlEvent = { type: "click"; x: number; y: number } | { type: "type"; text: string } | { type: "key"; key: string } | { type: "scroll"; x: number; y: number; dy: number };

const MAX_ITEMS = 650;
const transparent = (v: string) => !v || v === "transparent" || v === "rgba(0, 0, 0, 0)";

const MAX_MEDIA = 3;
/** JPEGs have no transparency, so a see-through page background would render black; find the first solid colour instead. */
function solidBg(): string {
  const list: Element[] = [];
  let n: Element | null = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
  while (n) { list.push(n); n = n.parentElement; }
  list.push(document.body, document.documentElement);
  for (const e of list) { const c = getComputedStyle(e).backgroundColor; if (!transparent(c)) return c; }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "#0d0d12" : "#ffffff";
}
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
    shotCanvas.getContext("2d")!.drawImage(src, 0, 0, shotCanvas.width, shotCanvas.height);
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

export function captureFrame(): ScreenFrame {
  mediaShots = 0; svgChars = 0;
  const w = window.innerWidth, h = window.innerHeight;
  const items: ScreenItem[] = [];
  walkDoc(document, 0, 0, w, h, items, 0);
  return { w, h, path: location.pathname, bg: solidBg(), items };
}

/** Draws same-origin pages (proxied web browser, arcade wrappers) as boxes/text, offset into the parent screen. */
function walkDoc(doc: Document, ox: number, oy: number, w: number, h: number, items: ScreenItem[], depth: number, sub = false) {
  const view = doc.defaultView; if (!view || !doc.body) return;
  const getComputedStyle = view.getComputedStyle.bind(view);
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  let el = walker.nextNode() as HTMLElement | null;
  while (el && items.length < MAX_ITEMS) {
    if (el.dataset?.["screenShare"] === "skip") { el = nextOutside(walker, el); continue; }
    const b = el.getBoundingClientRect();
    const r = { left: b.left + ox, top: b.top + oy, right: b.right + ox, bottom: b.bottom + oy, width: b.width, height: b.height };
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.right < 0 || r.top > h || r.left > w) {
      // Offscreen/collapsed: children of a zero box can still overflow, so only skip subtrees for hidden ones.
      if (r.width === 0 && r.height === 0 && el.childElementCount === 0) { el = nextOutside(walker, el); continue; }
      el = walker.nextNode() as HTMLElement | null; continue;
    }
    const tag = el.tagName;
    const item: ScreenItem = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), ...(sub ? { sub: true } : {}) };
    if (tag === "VIDEO" || tag === "IFRAME" || tag === "CANVAS" || tag === "EMBED" || tag === "OBJECT") {
      const shot = mediaShots < MAX_MEDIA ? snapshotMedia(el) : undefined;
      if (shot) mediaShots++;
      if (!shot && tag === "IFRAME" && depth < 2 && innerDoc(el)) {
        walkDoc(innerDoc(el)!, r.left, r.top, Math.min(w, r.right), Math.min(h, r.bottom), items, depth + 1, sub);
      } else items.push({ ...item, media: true, ...(shot ? { img: shot } : {}) });
      el = nextOutside(walker, el); continue;
    }
    const cs = getComputedStyle(el);
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
}

function innerDoc(el: HTMLElement): Document | null {
  try { const d = (el as HTMLIFrameElement).contentDocument; return d?.body ? d : null; } catch { return null; }
}

let captureWarningShown = false;

let subAt = 0;
let subCache: ScreenItem[] = [];
/** Only the media layers need a second pass after a successful picture; avoid walking/styling the whole DOM. */
function captureMediaItems(frame: Pick<ScreenFrame, "w" | "h">): ScreenItem[] {
  mediaShots = 0;
  const items: ScreenItem[] = [];
  const outline: ScreenItem[] = [];
  for (const el of document.body.querySelectorAll<HTMLElement>("video,iframe,canvas,embed,object")) {
    if (items.length >= MAX_MEDIA || el.closest("[data-screen-share='skip']")) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.right < 0 || r.top > frame.h || r.left > frame.w) continue;
    const item: ScreenItem = { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), media: true };
    const shot = snapshotMedia(el);
    if (shot) { item.img = shot; mediaShots++; items.push(item); continue; }
    const doc = el.tagName === "IFRAME" ? innerDoc(el) : null;
    if (doc) {
      // Walking a whole page is costly for the person being viewed, so redraw it at most every 4 seconds.
      if (Date.now() - subAt > 4000) {
        subAt = Date.now(); svgChars = 0; subCache = [];
        walkDoc(doc, item.x, item.y, Math.min(frame.w, item.x + item.w), Math.min(frame.h, item.y + item.h), subCache, 1, true);
        subCache = subCache.slice(0, 300);
      }
      outline.push(...subCache);
      continue;
    }
    try { const src = (el as HTMLIFrameElement).src || (el as HTMLVideoElement).currentSrc; item.t = [document.title, src ? new URL(src, location.href).hostname : ""].filter(Boolean).join(" · "); } catch { /* ignore */ }
    items.push(item);
  }
  // Pictures from other sites (movie posters, thumbnails) often draw black in the screenshot; resend their links so the viewer loads them itself.
  const pics: ScreenItem[] = [];
  for (const img of document.body.querySelectorAll<HTMLImageElement>("img")) {
    if (pics.length >= 60) break;
    if (!/^https?:/.test(img.currentSrc || img.src) || img.closest("[data-screen-share='skip']")) continue;
    const r = img.getBoundingClientRect();
    if (r.width < 24 || r.height < 24 || r.bottom < 0 || r.right < 0 || r.top > frame.h || r.left > frame.w) continue;
    pics.push({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), img: img.currentSrc || img.src, sub: true });
  }
  return [...pics, ...items, ...outline.slice(0, MAX_ITEMS)];
}

/** Backs off when captures are expensive so screen viewing never competes with the visitor's own interactions. */
export function nextCaptureDelay(captureMs: number): number {
  if (!Number.isFinite(captureMs) || captureMs < 0) return 6000;
  return Math.min(8000, Math.max(2200, Math.round(captureMs * 12)));
}

/** Cheap updates for animated media; the viewer keeps the last full picture underneath. */
export function captureMediaFrame(): ScreenFrame {
  const w = window.innerWidth, h = window.innerHeight;
  const base = { w, h, path: location.pathname, bg: solidBg() };
  return { ...base, items: captureMediaItems(base), mediaOnly: true };
}

/** Capture actual rendered pixels first; only pay for the full DOM outline when pixels are unavailable. */
export async function captureLiveFrame(): Promise<ScreenFrame> {
  const w = window.innerWidth, h = window.innerHeight;
  const base = { w, h, path: location.pathname, bg: solidBg() };
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
  while (n) { const s: Node | null = n.nextSibling; if (s) { walker.currentNode = s; return (s.nodeType === 1 ? s : walker.nextNode()) as HTMLElement | null; } n = n.parentNode; if (n === el.ownerDocument.body) return null; }
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

/** Full-screen share the visitor explicitly accepted: pixels from their chosen screen/window/tab. */
export async function startDisplayShare(): Promise<MediaStream | null> {
  try { return await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 5 }, audio: false }); }
  catch { return null; }
}

let streamCanvas: HTMLCanvasElement | null = null;
export function captureStreamFrame(video: HTMLVideoElement): ScreenFrame | null {
  const sw = video.videoWidth, sh = video.videoHeight;
  if (!sw || !sh || video.readyState < 2) return null;
  streamCanvas ??= document.createElement("canvas");
  const width = Math.min(1024, sw), height = Math.round(width * sh / sw);
  streamCanvas.width = width; streamCanvas.height = height;
  streamCanvas.getContext("2d")!.drawImage(video, 0, 0, width, height);
  for (const q of [0.6, 0.42, 0.28]) {
    const shot = streamCanvas.toDataURL("image/jpeg", q);
    if (shot.length < 235_000) return { w: width, h: height, path: "Whole screen (shared)", bg: "#000", shot, items: [], screen: true };
  }
  return null;
}
