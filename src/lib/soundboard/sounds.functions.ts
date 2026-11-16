import { createServerFn } from "@tanstack/react-start";

export type Sound = { name: string; url: string };

/** Public sound search backed by MyInstants pages (key-free). */
export const searchSounds = createServerFn({ method: "GET" })
  .inputValidator((d: { q?: string; page?: number }) => ({ q: String(d?.q ?? "").slice(0, 80), page: Math.min(Math.max(Number(d?.page) || 1, 1), 20) }))
  .handler(async ({ data }): Promise<{ sounds: Sound[]; error?: string }> => {
    const base = "https://www.myinstants.com";
    const url = data.q ? `${base}/en/search/?name=${encodeURIComponent(data.q)}&page=${data.page}` : `${base}/en/index/us/?page=${data.page}`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" } });
      if (!res.ok) return { sounds: [], error: `Sounds unavailable (${res.status})` };
      const html = await res.text();
      const files = [...html.matchAll(/play\('([^']+\.mp3)'/g)].map(m => m[1] ?? "").filter(Boolean);
      const names = [...html.matchAll(/class="instant-link[^"]*"[^>]*>([^<]*)</g)].map(m => (m[1] ?? "").trim());
      const seen = new Set<string>();
      const sounds: Sound[] = [];
      files.forEach((f, i) => { if (seen.has(f)) return; seen.add(f); sounds.push({ url: base + f, name: (names[i] || f.split("/").pop()!.replace(/\.mp3$/, "")).replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"') }); });
      return { sounds };
    } catch { return { sounds: [], error: "Sounds unavailable" }; }
  });
