import { createFileRoute } from "@tanstack/react-router";

/** Same-origin audio relay for soundboard clips. Public on purpose: only myinstants.com .mp3 files. */
export const Route = createFileRoute("/api/public/sound")({
  server: { handlers: { GET: async ({ request }) => {
    const raw = new URL(request.url).searchParams.get("u") ?? "";
    let t: URL; try { t = new URL(raw); } catch { return new Response("bad url", { status: 400 }); }
    if (t.protocol !== "https:" || !/(^|\.)myinstants\.com$/.test(t.hostname) || !t.pathname.endsWith(".mp3")) return new Response("forbidden", { status: 403 });
    const h: Record<string, string> = { "User-Agent": "Mozilla/5.0", Referer: "https://www.myinstants.com/" };
    const range = request.headers.get("range"); if (range) h['Range'] = range;
    const up = await fetch(t.toString(), { headers: h });
    const out = new Headers({ "content-type": "audio/mpeg", "cache-control": "public, max-age=86400", "accept-ranges": "bytes" });
    for (const k of ["content-length", "content-range"]) { const v = up.headers.get(k); if (v) out.set(k, v); }
    return new Response(up.body, { status: up.status, headers: out });
  } } },
});
