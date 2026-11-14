import { createFileRoute } from "@tanstack/react-router";

/**
 * Direct relay for the GTA V browser port (v2.fiveplay.lol). The port streams ~21 GB of data with many
 * parallel Range requests and needs cross-origin isolation (SharedArrayBuffer), which the in-page
 * proxy handles far too slowly. This relays the site verbatim from Astra's own domain instead, as a
 * top-level page. Public on purpose: it only relays one fixed public site, no user data.
 */
const PREFIX = "/api/public/fp";
const UPSTREAM = "https://v2.fiveplay.lol";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const PASS = ["content-type", "content-range", "accept-ranges", "x-run-lengths", "cache-control", "etag", "last-modified"];
const ISOLATION = {
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-embedder-policy": "credentialless",
  "cross-origin-resource-policy": "cross-origin",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, HEAD, POST, OPTIONS",
  "access-control-allow-headers": "Range, Content-Type",
  "access-control-expose-headers": "Content-Range, Content-Length, Accept-Ranges, X-Run-Lengths",
};

/** Build workers concatenate a build base with dynamically selected root-like filenames. */
export function fiveplayUpstreamPath(path: string): string {
  return path.replace(/^(\/b\/[a-z0-9_-]+)\/api\/public\/fp\//i, "$1/");
}

/** Keep V2's launcher, UI, engine and data URLs inside the tuned relay. */
export function rewriteFiveplay(text: string, html: boolean): string {
  let out = text.replace(/(?:https?:)?\/\/(?:v2\.|www\.)?fiveplay\.lol(?=[/"'`?#\s]|$)/gi, PREFIX);
  // Match complete path literals, not quotes inside regular expressions. BASE + '/loader.js'
  // already inherits the rewritten build prefix and must not gain a second relay prefix.
  out = out.replace(/(['"`])(\/[a-zA-Z0-9_-][^'"`\r\n]*?)\1/g, (match, quote: string, path: string, offset: number, input: string) => {
    const before = input.slice(Math.max(0, offset - 60), offset);
    // Engine filesystem paths (/userdata, /dev, /proc, etc.) are not HTTP URLs.
    if (!/^\/(?:b\/|data\/|touch_art\/|branding\/|log(?:[?#]|$)|shot\?)/.test(path) && !/\.(?:js|wasm|css|png|jpe?g|webp|svg|woff2?|mp[34]|ogg|webm)(?:[?#]|$)/i.test(path)) return match;
    if (path.startsWith(`${PREFIX}/`) || (/\+\s*$/.test(before) && !/\.origin\s*\+\s*$/.test(before))) return match;
    return `${quote}${PREFIX}${path}${quote}`;
  });
  out = out.replace(/(url\(\s*)\/(?!\/|api\/public\/fp\/)/gi, `$1${PREFIX}/`);
  if (html) {
    out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (tag) => (/quge5\.com|alwingulla\.com/i.test(tag) ? "" : tag));
    out = out.replace(/<head([^>]*)>/i, `<head$1><base href="${PREFIX}/">`);
  }
  return out;
}

async function relay(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: ISOLATION });
  const path = fiveplayUpstreamPath(url.pathname.slice(PREFIX.length) || "/");
  if (path.split("/").some((s) => s === ".." || s === ".")) return new Response("Not found", { status: 404, headers: ISOLATION });
  // The data loader POSTs batched block lists to /data/batch; other POSTs (logs) and screenshots are diagnostics.
  const isBatch = request.method === "POST" && path.startsWith("/data/batch");
  if ((request.method === "POST" && !isBatch) || path.startsWith("/shot")) return new Response(null, { status: 204, headers: ISOLATION });

  const fwd: Record<string, string> = { "user-agent": UA };
  for (const h of ["range", "if-none-match", "if-modified-since", "content-type"]) { const v = request.headers.get(h); if (v) fwd[h] = v; }
  let upstream: Response;
  try {
    const method = isBatch ? "POST" : request.method === "HEAD" ? "HEAD" : "GET";
    upstream = await fetch(`${UPSTREAM}${path}${url.search}`, { method, headers: fwd, body: isBatch ? await request.arrayBuffer() : null, redirect: "follow" });
  } catch {
    return new Response("Game server unreachable", { status: 502, headers: ISOLATION });
  }

  const headers = new Headers(ISOLATION);
  for (const h of PASS) { const v = upstream.headers.get(h); if (v) headers.set(h, v); }
  const type = (upstream.headers.get("content-type") ?? "").toLowerCase();
  const isHtml = type.includes("text/html");
  const isJs = type.includes("javascript");
  const isCss = type.includes("text/css");
  if ((isHtml || isJs || isCss) && request.method !== "HEAD" && upstream.status === 200) {
    const body = rewriteFiveplay(await upstream.text(), isHtml);
    if (isHtml) headers.set("cache-control", "no-store");
    return new Response(body, { status: 200, headers });
  }
  const len = upstream.headers.get("content-length");
  if (len && !upstream.headers.get("content-encoding")) headers.set("content-length", len);
  return new Response(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers });
}

export const Route = createFileRoute("/api/public/fp/$")({
  server: {
    handlers: {
      GET: ({ request }) => relay(request),
      HEAD: ({ request }) => relay(request),
      POST: ({ request }) => relay(request),
      OPTIONS: ({ request }) => relay(request),
    },
  },
});
