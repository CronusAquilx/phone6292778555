import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchSounds, type Sound } from "@/lib/soundboard/sounds.functions";

const QUICK = ["fahh", "quandale dingle", "vine boom", "bruh", "sus", "rizz", "skibidi", "oh no", "airhorn", "sad violin", "emotional damage", "windows error", "goofy", "meme", "anime wow", "minecraft"];

export function Soundboard() {
  const search = useServerFn(searchSounds);
  const [q, setQ] = useState(""); const [term, setTerm] = useState(""); const [page, setPage] = useState(1);
  const [sounds, setSounds] = useState<Sound[]>([]); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [playing, setPlaying] = useState<string | null>(null); const [vol, setVol] = useState(0.8);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => { let off = false; setBusy(true); setErr("");
    search({ data: { q: term, page } }).then(r => { if (off) return; setSounds(s => page === 1 ? r.sounds : [...s, ...r.sounds]); if (r.error) setErr(r.error); }).finally(() => !off && setBusy(false));
    return () => { off = true; }; }, [term, page]);
  const go = (t: string) => { setQ(t); setTerm(t); setPage(1); };
  const play = (s: Sound) => { audio.current?.pause(); const a = new Audio(`/api/public/sound?u=${encodeURIComponent(s.url)}`); a.volume = vol; audio.current = a; setPlaying(s.url); a.onended = () => setPlaying(null); a.play().catch(() => { setPlaying(null); setErr("That sound could not play, try another."); }); };
  const stop = () => { audio.current?.pause(); setPlaying(null); };
  return <div className="flex h-full flex-col gap-3">
    <form className="flex gap-2" onSubmit={e => { e.preventDefault(); go(q.trim()); }}>
      <Input aria-label="Search sounds" value={q} onChange={e => setQ(e.target.value)} placeholder="Search thousands of sounds"/>
      <Button type="submit">Search</Button><Button type="button" variant="secondary" onClick={stop}>Stop</Button>
    </form>
    <div className="flex flex-wrap gap-1">{["Trending", ...QUICK].map(t => <Button key={t} size="sm" variant={(t === "Trending" ? "" : t) === term ? "default" : "outline"} onClick={() => go(t === "Trending" ? "" : t)}>{t}</Button>)}</div>
    <label className="flex items-center gap-2 text-xs text-muted-foreground">Volume<input type="range" min={0} max={1} step={0.05} value={vol} onChange={e => { const v = +e.target.value; setVol(v); if (audio.current) audio.current.volume = v; }}/></label>
    {err && <p className="text-sm text-destructive">{err}</p>}
    <div className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(120px,1fr))] content-start gap-2 overflow-auto">
      {sounds.map(s => <button key={s.url} onClick={() => play(s)} className={`rounded-lg border p-3 text-left text-sm font-medium transition hover:bg-accent ${playing === s.url ? "bg-primary text-primary-foreground" : "bg-card"}`}>{playing === s.url ? "▶ " : ""}{s.name}</button>)}
    </div>
    <Button variant="secondary" disabled={busy} onClick={() => setPage(p => p + 1)}>{busy ? "Loading…" : "Load more sounds"}</Button>
  </div>;
}
