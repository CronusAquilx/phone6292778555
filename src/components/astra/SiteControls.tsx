import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCENTS, DEFAULT_PREFS, type Prefs } from "@/lib/astra/prefs";
import { ALL_STREAMING_SERVERS, fetchSiteConfig, saveSiteConfig, type SiteConfig } from "@/lib/astra/site-config";

const LAYOUTS: Prefs["layout"][] = ["windows", "windows2", "macos", "ipad", "switch", "classic", "launcher"];
const PALETTES: Prefs["palette"][] = ["default", "midnight", "forest", "ocean", "sunset", "mono", "candy", "dracula", "nord", "cyberpunk", "coffee", "sakura", "matrix", "arctic", "lava", "royal", "synthwave", "paper", "mint", "galaxy"];
const BACKGROUNDS: Prefs["background"][] = ["plain", "dots", "grid", "glow"];

/** Admin-only editor for site-wide sources and default look. Database policies enforce admin writes. */
export function SiteControls() {
  const [c, setC] = useState<SiteConfig>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { void fetchSiteConfig().then(setC); }, []);
  const off = new Set(c.disabledSources ?? []);
  const order = [...ALL_STREAMING_SERVERS].sort((a, b) => { const o = c.sourceOrder ?? []; const r = (id: string) => { const i = o.indexOf(id); return i < 0 ? 999 : i; }; return r(a.id) - r(b.id); }).map(s => s.id);
  const move = (id: string, dir: -1 | 1) => { const list = [...order]; const i = list.indexOf(id); const j = i + dir; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j]!, list[i]!]; setC({ ...c, sourceOrder: list }); };
  const toggle = (id: string) => { const n = new Set(off); n.has(id) ? n.delete(id) : n.add(id); setC({ ...c, disabledSources: [...n] }); };
  const def = c.defaults ?? {};
  const setDef = (p: Partial<NonNullable<SiteConfig["defaults"]>>) => setC({ ...c, defaults: { ...def, ...p } });
  const sel = <K extends keyof NonNullable<SiteConfig["defaults"]>>(k: K, opts: string[], label: string) => (
    <label className="flex items-center justify-between gap-3 text-sm">{label}
      <select className="rounded border bg-background px-2 py-1" value={String(def[k] ?? DEFAULT_PREFS[k as keyof Prefs])} onChange={e => setDef({ [k]: e.target.value } as never)}>{opts.map(o => <option key={o} value={o}>{o}</option>)}</select>
    </label>);
  async function save() { setBusy(true); try { await saveSiteConfig(c); toast.success("Site settings saved for everyone"); } catch { toast.error("Couldn't save. Only admins can change site settings."); } finally { setBusy(false); } }

  return <section className="space-y-6" aria-label="Site controls">
    <div><h2 className="text-lg font-medium">Site controls</h2><p className="text-sm text-muted-foreground">Changes apply to every visitor. Turned-off sources disappear from Movies; order sets which source plays first.</p></div>
    <div className="space-y-1 rounded-lg border p-3">
      <h3 className="text-sm font-medium">Movie sources</h3>
      {order.map((id, i) => { const s = ALL_STREAMING_SERVERS.find(x => x.id === id)!; return <div key={id} className="flex items-center gap-2 border-b py-1.5 text-sm last:border-0">
        <span className="w-6 text-muted-foreground">{i + 1}</span><span className="flex-1">{s.name} <span className="text-xs text-muted-foreground">({s.category})</span></span>
        <Button size="sm" variant="ghost" aria-label={`Move ${s.name} up`} onClick={() => move(id, -1)}>↑</Button>
        <Button size="sm" variant="ghost" aria-label={`Move ${s.name} down`} onClick={() => move(id, 1)}>↓</Button>
        <Button size="sm" variant={off.has(id) ? "outline" : "secondary"} onClick={() => toggle(id)}>{off.has(id) ? "Off" : "On"}</Button>
      </div>; })}
    </div>
    <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
      <h3 className="text-sm font-medium sm:col-span-2">Default look for new visitors</h3>
      {sel("layout", LAYOUTS, "Layout")}
      {sel("accent", Object.keys(ACCENTS), "Accent color")}
      {sel("palette", PALETTES, "Color theme")}
      {sel("background", BACKGROUNDS, "Background pattern")}
      {sel("seasonalTheme", ["neither", "christmas", "thanksgiving"], "Seasonal theme")}
      <label className="flex items-center justify-between gap-3 text-sm">Site name<Input className="w-44" value={def.homeName ?? DEFAULT_PREFS.homeName} onChange={e => setDef({ homeName: e.target.value })} /></label>
      <label className="flex items-center justify-between gap-3 text-sm">Tagline<Input className="w-44" value={def.tagline ?? DEFAULT_PREFS.tagline} onChange={e => setDef({ tagline: e.target.value })} /></label>
      <label className="flex items-center justify-between gap-3 text-sm">Text size %<Input type="number" className="w-24" min={80} max={140} value={def.fontScale ?? DEFAULT_PREFS.fontScale} onChange={e => setDef({ fontScale: Number(e.target.value) || 100 })} /></label>
    </div>
    <div className="flex gap-2"><Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save site settings"}</Button><Button variant="ghost" onClick={() => setC({})}>Reset to defaults</Button></div>
  </section>;
}
