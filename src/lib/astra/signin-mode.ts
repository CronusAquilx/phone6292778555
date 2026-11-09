/**
 * Sign-in mode routes a site through a browser-side Wisp tunnel instead of the
 * server relay. Login and captcha systems flag the relay's datacenter address and
 * guests can't post forms through it, so account sites start in this mode.
 */
const KEY = "birch-signin-mode";
const DEFAULT_HOSTS = ["discord.com", "tiktok.com", "fanduel.com", "github.com", "twitch.tv", "kick.com", "spotify.com", "reddit.com", "x.com", "instagram.com", "duolingo.com"];

export function siteKey(url: string | null | undefined): string {
  try { return new URL(url ?? "").hostname.replace(/^www\./, "").split(".").slice(-2).join("."); } catch { return ""; }
}

function read(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, boolean>; } catch { return {}; }
}

export function signInModeOn(url: string | null | undefined): boolean {
  const key = siteKey(url);
  if (!key) return false;
  const saved = typeof window === "undefined" ? {} : read();
  if (key in saved) return !!saved[key];
  return DEFAULT_HOSTS.some((h) => key === siteKey(`https://${h}`));
}

export function setSignInMode(url: string | null | undefined, on: boolean): void {
  const key = siteKey(url);
  if (!key) return;
  try { localStorage.setItem(KEY, JSON.stringify({ ...read(), [key]: on })); } catch { /* storage unavailable */ }
}
