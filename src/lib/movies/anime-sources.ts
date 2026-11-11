export type AnimeMatch = { id: number; anilistId?: number; title: string; episodes: number | null };

export function supportsAnimationSources(detail: { genres?: { id: number }[]; genre_ids?: number[] } | undefined): boolean {
  return Boolean(detail?.genres?.some(genre => genre.id === 16) || detail?.genre_ids?.includes(16));
}

/** Anikoto's actual site search, not an invented embed/audio API. */
export function anikotoSearchUrl(title: string): string {
  const url = new URL('https://anikoto.ro/search');
  url.searchParams.set('keyword', title.trim());
  return url.toString();
}

/** HiAnime's real site search, opened through the proxy. */
export function hianimeSearchUrl(title: string): string {
  const url = new URL('https://hianime.to/search');
  url.searchParams.set('keyword', title.trim());
  return url.toString();
}

/** VidLink's documented anime API uses MAL IDs, not TMDB IDs. No fallback to sub. */
export function animeVoiceUrl(malId: number, episode: number, voice: 'en' | 'ja'): string {
  return `https://vidlink.pro/anime/${malId}/${episode}/${voice === 'en' ? 'dub' : 'sub'}`;
}

export function animeIcuVoiceUrl(anilistId: number, episode: number, voice: 'en' | 'ja'): string {
  return `https://vidsrc.icu/embed/anime/${anilistId}/${episode}/${voice === 'en' ? 1 : 0}`;
}

/** Real anime site searches, opened through the proxy. Shown only for anime titles. */
export const ANIME_SEARCH_SITES = [
  { id: 'anikoto', name: 'Anikoto', search: (q: string) => anikotoSearchUrl(q) },
  { id: 'hianime', name: 'HiAnime', search: (q: string) => hianimeSearchUrl(q) },
  { id: 'animekai', name: 'AnimeKai', search: (q: string) => `https://animekai.to/browser?keyword=${encodeURIComponent(q.trim())}` },
  { id: 'miruro', name: 'Miruro', search: (q: string) => `https://www.miruro.to/search?query=${encodeURIComponent(q.trim())}` },
  { id: '9anime', name: '9Anime', search: (q: string) => `https://9animetv.to/search?keyword=${encodeURIComponent(q.trim())}` },
  { id: 'animepahe', name: 'AnimePahe', search: (q: string) => `https://animepahe.ru/?q=${encodeURIComponent(q.trim())}` },
  { id: 'kaido', name: 'Kaido', search: (q: string) => `https://kaido.to/search?keyword=${encodeURIComponent(q.trim())}` },
] as const;
