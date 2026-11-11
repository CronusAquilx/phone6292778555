import { supabase } from "@/integrations/supabase/client";
import { STREAMING_SERVERS } from "@/lib/movies/tmdb";
import { DEFAULT_PREFS, type Prefs } from "@/lib/astra/prefs";

/** Admin-controlled, site-wide settings stored in one public row. */
export type SiteConfig = {
  disabledSources?: string[];
  sourceOrder?: string[];
  defaults?: Partial<Pick<Prefs, "layout" | "accent" | "palette" | "background" | "tagline" | "homeName" | "seasonalTheme" | "fontScale" | "radius">>;
};

export const ALL_STREAMING_SERVERS = [...STREAMING_SERVERS];
const BASE_DEFAULTS = { ...DEFAULT_PREFS };

/** Mutates the shared source list in place so every player sees admin choices. */
export function applySiteConfig(config: SiteConfig) {
  const off = new Set(config.disabledSources ?? []);
  const order = config.sourceOrder ?? [];
  const rank = (id: string) => { const i = order.indexOf(id); return i < 0 ? 1000 + ALL_STREAMING_SERVERS.findIndex(s => s.id === id) : i; };
  const next = ALL_STREAMING_SERVERS.filter(s => !off.has(s.id)).sort((a, b) => rank(a.id) - rank(b.id));
  STREAMING_SERVERS.splice(0, STREAMING_SERVERS.length, ...(next.length ? next : ALL_STREAMING_SERVERS));
  Object.assign(DEFAULT_PREFS, BASE_DEFAULTS, config.defaults ?? {});
}

export async function fetchSiteConfig(): Promise<SiteConfig> {
  const { data } = await supabase.from("site_config").select("data").eq("id", 1).maybeSingle();
  return (data?.data && typeof data.data === "object" && !Array.isArray(data.data) ? data.data : {}) as SiteConfig;
}

let started = false;
export function loadSiteConfig() {
  if (started || typeof window === "undefined") return;
  started = true;
  void fetchSiteConfig().then(applySiteConfig).catch(() => {});
}

export async function saveSiteConfig(config: SiteConfig) {
  const { error } = await supabase.from("site_config").upsert({ id: 1, data: config as never, updated_at: new Date().toISOString() });
  if (error) throw error;
  applySiteConfig(config);
}
