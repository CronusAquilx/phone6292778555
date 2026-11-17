import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/status")({
  head: () => ({ meta: [
    { title: "Status — Birch OS" }, { name: "description", content: "Live proxy uptime, speed and blocked services." },
    { property: "og:title", content: "Status — Birch OS" }, { property: "og:description", content: "Live proxy uptime, speed and blocked services." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: StatusPage,
});

const CHECKS: { name: string; url: string; local?: boolean }[] = [
  { name: "Website", url: "/", local: true }, { name: "Proxy", url: "/api/proxy", local: true },
  { name: "Sound relay", url: "/api/public/sound", local: true }, { name: "YouTube", url: "https://www.youtube.com/favicon.ico" },
  { name: "Discord", url: "https://discord.com/favicon.ico" }, { name: "Twitch", url: "https://www.twitch.tv/favicon.ico" },
  { name: "Movies (VidLink)", url: "https://vidlink.pro/favicon.ico" }, { name: "Movies (Videasy)", url: "https://player.videasy.net/favicon.ico" },
  { name: "Sounds (MyInstants)", url: "https://www.myinstants.com/favicon.ico" }, { name: "Music (iTunes)", url: "https://itunes.apple.com/favicon.ico" },
];
type R = { ok: boolean; ms: number };

async function probe(c: (typeof CHECKS)[number]): Promise<R> {
  const t = performance.now(); const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 8000);
  try { await fetch(c.url + (c.url.includes("?") ? "&" : "?") + "t=" + Date.now(), { mode: c.local ? "same-origin" : "no-cors", cache: "no-store", signal: ctl.signal }); return { ok: true, ms: Math.round(performance.now() - t) }; }
  catch { return { ok: false, ms: Math.round(performance.now() - t) }; } finally { clearTimeout(to); }
}

function StatusPage() {
  const [res, setRes] = useState<Record<string, R>>({}); const tally = useRef({ up: 0, all: 0 }); const [, tick] = useState(0); const start = useRef(Date.now());
  useEffect(() => { let off = false;
    const run = async () => { const out = await Promise.all(CHECKS.map(probe)); if (off) return;
      tally.current.all++; if (out[1].ok) tally.current.up++; setRes(Object.fromEntries(CHECKS.map((c, i) => [c.name, out[i]]))); };
    run(); const id = setInterval(run, 15000); const sec = setInterval(() => tick(x => x + 1), 1000);
    return () => { off = true; clearInterval(id); clearInterval(sec); }; }, []);
  const p = res["Proxy"]; const up = tally.current.all ? Math.round((tally.current.up / tally.current.all) * 100) : 0;
  const mins = Math.floor((Date.now() - start.current) / 60000);
  const blocked = CHECKS.filter(c => res[c.name] && !res[c.name].ok);
  return <main className="mx-auto max-w-2xl space-y-6 p-6 text-foreground">
    <header className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Status</h1><Link to="/" className="text-sm text-primary underline">Home</Link></header>
    <section className="grid grid-cols-3 gap-3">
      {[["Proxy uptime", tally.current.all ? `${up}%` : "…"], ["Current speed", p ? (p.ok ? `${p.ms} ms` : "Down") : "…"], ["Blocked", `${blocked.length}`]].map(([k, v]) =>
        <div key={k} className="rounded-xl border bg-card p-4"><div className="text-xs text-muted-foreground">{k}</div><div className="text-2xl font-semibold">{v}</div></div>)}
    </section>
    <p className="text-xs text-muted-foreground">Checked from your network every 15 seconds · watching for {mins} min</p>
    <ul className="divide-y rounded-xl border bg-card">
      {CHECKS.map(c => { const r = res[c.name]; return <li key={c.name} className="flex items-center justify-between p-3 text-sm">
        <span>{c.name}</span><span className={r ? (r.ok ? "text-primary" : "text-destructive") : "text-muted-foreground"}>{r ? (r.ok ? `Working · ${r.ms} ms` : "Blocked") : "Checking…"}</span></li>; })}
    </ul>
  </main>;
}
