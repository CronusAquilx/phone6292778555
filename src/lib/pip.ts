import { useSyncExternalStore } from "react";

export type MiniPlayer = { url: string; title: string };
let current: MiniPlayer | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());
export const openMiniPlayer = (p: MiniPlayer) => { current = p; emit(); };
export const closeMiniPlayer = () => { current = null; emit(); };
export const useMiniPlayer = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => current, () => null);

/** Native picture-in-picture for the playing video inside a same-origin proxied page. */
export async function nativeVideoPip(frame: HTMLIFrameElement | null | undefined): Promise<boolean> {
  try {
    const doc = frame?.contentDocument;
    const videos = Array.from(doc?.querySelectorAll("video") ?? []) as HTMLVideoElement[];
    const video = videos.find(v => !v.paused) ?? videos.find(v => v.readyState > 0);
    if (!video || !document.pictureInPictureEnabled || typeof video.requestPictureInPicture !== "function") return false;
    await video.requestPictureInPicture();
    return true;
  } catch { return false; }
}
