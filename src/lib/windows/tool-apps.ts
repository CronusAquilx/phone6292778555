import { useSyncExternalStore } from "react";

export type ToolCategory = "Utilities" | "Productivity" | "Customize" | "Fun" | "Health" | "Developer" | "Social" | "Entertainment" | "Gaming";
/** `url` marks a web app that opens through the proxy in its own app window. */
export type ToolApp = { id: string; title: string; category: ToolCategory; detail: string; tone: string; url?: string };

/** Downloadable mini apps offered in the Birch Store. */
export const TOOL_APPS: ToolApp[] = [
  { id: "theme-studio", title: "Theme Studio", category: "Customize", detail: "Accent colors, palettes, light/dark", tone: "violet" },
  { id: "layout-switcher", title: "Layout Switcher", category: "Customize", detail: "Swap between Windows, macOS, iPad and more", tone: "cyan" },
  { id: "ui-tuner", title: "UI Tuner", category: "Customize", detail: "Text size, corner roundness, glass and spacing", tone: "gold" },
  { id: "effects", title: "Desktop Effects", category: "Customize", detail: "Snow, rain, stars and fireflies", tone: "green" },
  { id: "clock-style", title: "Clock Styles", category: "Customize", detail: "Pick a font for your clock", tone: "coral" },
  { id: "calculator", title: "Calculator", category: "Utilities", detail: "Quick math", tone: "neutral" },
  { id: "converter", title: "Unit Converter", category: "Utilities", detail: "Length, weight, temperature", tone: "cyan" },
  { id: "weather", title: "Weather", category: "Utilities", detail: "Forecast for any city", tone: "cyan" },
  { id: "world-clock", title: "World Clock", category: "Utilities", detail: "Time around the world", tone: "gold" },
  { id: "stopwatch", title: "Stopwatch", category: "Utilities", detail: "Laps and timing", tone: "coral" },
  { id: "timer", title: "Timer", category: "Utilities", detail: "Countdown with alarm", tone: "rose" },
  { id: "calendar", title: "Calendar", category: "Utilities", detail: "Month view", tone: "rose" },
  { id: "password", title: "Password Maker", category: "Utilities", detail: "Strong random passwords", tone: "green" },
  { id: "tip", title: "Tip Splitter", category: "Utilities", detail: "Split bills and tips", tone: "green" },
  { id: "age", title: "Age Calculator", category: "Utilities", detail: "Exact age and days alive", tone: "violet" },
  { id: "notes", title: "Sticky Notes", category: "Productivity", detail: "Quick notes saved on this device", tone: "gold" },
  { id: "todo", title: "To-Do", category: "Productivity", detail: "Checklists that stick around", tone: "cyan" },
  { id: "pomodoro", title: "Focus Timer", category: "Productivity", detail: "25/5 focus sessions", tone: "coral" },
  { id: "word-count", title: "Word Counter", category: "Productivity", detail: "Words, characters, reading time", tone: "neutral" },
  { id: "habits", title: "Habit Tracker", category: "Productivity", detail: "Build streaks daily", tone: "green" },
  { id: "flashcards", title: "Flashcards", category: "Productivity", detail: "Make and study cards", tone: "violet" },
  { id: "paint", title: "Paint", category: "Fun", detail: "Draw and save pictures", tone: "rose" },
  { id: "dice", title: "Dice & Coin", category: "Fun", detail: "Roll dice or flip a coin", tone: "gold" },
  { id: "typing", title: "Typing Test", category: "Fun", detail: "Measure your words per minute", tone: "cyan" },
  { id: "reaction", title: "Reaction Test", category: "Fun", detail: "How fast are you?", tone: "coral" },
  { id: "metronome", title: "Metronome", category: "Fun", detail: "Keep the beat", tone: "neutral" },
  { id: "breathe", title: "Breathe", category: "Health", detail: "Guided breathing", tone: "green" },
  { id: "water", title: "Water Tracker", category: "Health", detail: "Daily glasses of water", tone: "cyan" },
  { id: "bmi", title: "BMI Calculator", category: "Health", detail: "Body mass index", tone: "rose" },
  { id: "json", title: "JSON Formatter", category: "Developer", detail: "Pretty-print and validate", tone: "gold" },
  { id: "base64", title: "Base64 / URL", category: "Developer", detail: "Encode and decode text", tone: "violet" },
  { id: "color-picker", title: "Color Picker", category: "Developer", detail: "HEX, RGB and HSL", tone: "coral" },
  { id: "screen-info", title: "Device Info", category: "Developer", detail: "Screen, browser and connection", tone: "neutral" },
];

/** Web apps: real sites opened through the proxy as their own installable apps. */
export const WEB_APPS: ToolApp[] = [
  { id: "twitch", title: "Twitch", category: "Entertainment", detail: "Live streams and gaming", tone: "violet", url: "https://www.twitch.tv/" },
  { id: "kick", title: "Kick", category: "Entertainment", detail: "Live streaming", tone: "green", url: "https://kick.com/" },
  { id: "spotify", title: "Spotify", category: "Entertainment", detail: "Music and podcasts", tone: "green", url: "https://open.spotify.com/" },
  { id: "soundcloud", title: "SoundCloud", category: "Entertainment", detail: "Tracks from independent artists", tone: "coral", url: "https://soundcloud.com/" },
  { id: "anikoto", title: "Anikoto", category: "Entertainment", detail: "Watch anime", tone: "rose", url: "https://anikoto.cz/" },
  { id: "crunchyroll", title: "Crunchyroll", category: "Entertainment", detail: "Anime streaming", tone: "coral", url: "https://www.crunchyroll.com/" },
  { id: "netflix", title: "Netflix", category: "Entertainment", detail: "Movies and series", tone: "rose", url: "https://www.netflix.com/" },
  { id: "tiktok", title: "TikTok", category: "Entertainment", detail: "Short videos", tone: "neutral", url: "https://www.tiktok.com/" },
  { id: "discord", title: "Discord", category: "Social", detail: "Chat, voice and servers", tone: "violet", url: "https://discord.com/app" },
  { id: "reddit", title: "Reddit", category: "Social", detail: "Communities and discussions", tone: "coral", url: "https://www.reddit.com/" },
  { id: "x", title: "X", category: "Social", detail: "Posts and trends", tone: "neutral", url: "https://x.com/" },
  { id: "instagram", title: "Instagram", category: "Social", detail: "Photos, reels and stories", tone: "rose", url: "https://www.instagram.com/" },
  { id: "whatsapp", title: "WhatsApp", category: "Social", detail: "Messages on the web", tone: "green", url: "https://web.whatsapp.com/" },
  { id: "pinterest", title: "Pinterest", category: "Social", detail: "Ideas and inspiration", tone: "rose", url: "https://www.pinterest.com/" },
  { id: "github", title: "GitHub", category: "Developer", detail: "Code and repositories", tone: "neutral", url: "https://github.com/" },
  { id: "wikipedia", title: "Wikipedia", category: "Productivity", detail: "The free encyclopedia", tone: "neutral", url: "https://www.wikipedia.org/" },
  { id: "duolingo", title: "Duolingo", category: "Productivity", detail: "Learn a language", tone: "green", url: "https://www.duolingo.com/" },
  { id: "chess", title: "Chess.com", category: "Gaming", detail: "Play chess online", tone: "green", url: "https://www.chess.com/" },
  { id: "roblox", title: "Roblox", category: "Gaming", detail: "Browse experiences and friends", tone: "neutral", url: "https://www.roblox.com/" },
];

export const ALL_TOOL_APPS = [...TOOL_APPS, ...WEB_APPS];
export const toolById = (id: string) => ALL_TOOL_APPS.find(t => t.id === id);
export const toolAppId = (id: string) => `tool:${id}` as const;
export const toolFromApp = (app: string) => app.startsWith("tool:") ? toolById(app.slice(5)) : undefined;

const KEY = "birch-installed-tools";
const DEFAULT_INSTALLED = ["theme-studio", "layout-switcher", "calculator", "notes"];
const subs = new Set<() => void>();
let cache: string[] | null = null;
function read(): string[] {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT_INSTALLED;
  try { const raw = localStorage.getItem(KEY); cache = raw ? (JSON.parse(raw) as string[]).filter(id => toolById(id)) : DEFAULT_INSTALLED; } catch { cache = DEFAULT_INSTALLED; }
  return cache;
}
function write(ids: string[]) { cache = ids; try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage full */ } subs.forEach(f => f()); }
export const installTool = (id: string) => { if (!read().includes(id)) write([...read(), id]); };
export const uninstallTool = (id: string) => write(read().filter(x => x !== id));
export function useInstalledTools(): string[] {
  return useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, read, () => DEFAULT_INSTALLED);
}
