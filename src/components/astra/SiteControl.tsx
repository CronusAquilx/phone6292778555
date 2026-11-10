import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOutAll } from "@/lib/auth";
import { applyControl, captureLiveFrame, captureMediaFrame, nextCaptureDelay, type ControlEvent, type ScreenFrame } from "@/lib/astra/screen-share";
import { normalizeCommandCursor, parseViewSession, type ViewSession } from "@/lib/astra/view-session";
import { visitorCommands } from "@/lib/astra/visitor-commands.functions";
import { TrollLayer } from "./TrollLayer";
import { Button } from "@/components/ui/button";
import { MonitorUp, Square } from "lucide-react";
import { requestEntireScreen } from "@/lib/astra/display-share";

export type LiveVisitor = { key: string; deviceId: string; userId: string | null; name: string; path: string; since: string; owner: boolean; idle?: boolean };
export const OWNER_EMAIL = "qaisdev@gmail.org";

let visitors: LiveVisitor[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
export const useLiveVisitors = () =>
  useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => visitors, () => visitors);

let presence: ReturnType<typeof supabase.channel> | null = null;
/** Asks every tab to re-check whether its device is banned (the server decides). */
export const broadcastBanCheck = () => presence?.send({ type: "broadcast", event: "ban-check", payload: {} });
/** Tells signed-out visitors (one device, or "*" for all) to fetch new commands from the server. */
export const pingDevice = (deviceId: string) => presence?.send({ type: "broadcast", event: "device-ping", payload: { deviceId } });

const tabKey = () => {
  let k = sessionStorage.getItem("birch-tab-key");
  if (!k) { k = crypto.randomUUID(); sessionStorage.setItem("birch-tab-key", k); }
  return k;
};
export const deviceId = () => {
  let k = localStorage.getItem("birch-device-id");
  if (!k) { k = crypto.randomUUID(); localStorage.setItem("birch-device-id", k); }
  return k;
};

type Cmd = { kind: string; message: string | null };

/** Shares this tab's presence and obeys staff commands (message, announce, pause, redirect, reload, kick, ban, screen view). Mounted once at the root. */
export function SiteControl() {
  const { user, guest } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [paused, setPaused] = useState<string | null>(null);
  const [announce, setAnnounce] = useState<string | null>(null);
  const [banned, setBanned] = useState(false);
  const [viewing, setViewing] = useState<ViewSession | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [answeredRequest, setAnsweredRequest] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shareChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const viewingRef = useRef(viewing); viewingRef.current = viewing;
  const [idle, setIdle] = useState(false);
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);
  const owner = user?.email?.toLowerCase() === OWNER_EMAIL;
  const fetchVisitor = useServerFn(visitorCommands);
  const since = useRef(new Date().toISOString());
  const userRef = useRef(user); userRef.current = user;

  const checkBan = () => { void supabase.rpc("is_device_banned", { _device: deviceId() }).then(({ data }) => setBanned(Boolean(data))); };
  useEffect(checkBan, [user]);

  const handle = (cmd: Cmd) => {
    if (cmd.kind === "message") toast(cmd.message ?? "", { description: "Message from the staff", duration: 15000 });
    if (cmd.kind === "announce") setAnnounce(cmd.message || "Announcement");
    if (cmd.kind === "unannounce") setAnnounce(null);
    if (cmd.kind === "view" && cmd.message) {
      const session = parseViewSession(cmd.message);
      if (session) setViewing(session);
    }
    if (cmd.kind === "unview" && (!cmd.message || viewing?.id === cmd.message)) setViewing(null);
    if (owner) return; // the owner can't be paused, redirected, kicked or banned
    if (cmd.kind === "pause") setPaused(cmd.message || "Your screen was paused by the staff.");
    if (cmd.kind === "resume") setPaused(null);
    if (cmd.kind === "reload") window.location.reload();
    if (cmd.kind === "redirect" && cmd.message && /^\/(?!\/)[^\\\s]*$/.test(cmd.message)) window.location.assign(cmd.message);
    if (cmd.kind === "kick") { void signOutAll().finally(() => window.location.replace("/")); }
    if (cmd.kind === "ban") checkBan();
    if (cmd.kind === "troll" && cmd.message) setTroll(cmd.message);
    if (cmd.kind === "untroll") setTroll(null);
  };
  const [troll, setTroll] = useState<string | null>(null);
  const handleRef = useRef(handle); handleRef.current = handle;

  // Visitor activity (idle after 60s without input) shown to staff.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const wake = () => { setIdle(false); clearTimeout(t); t = setTimeout(() => setIdle(true), 60_000); };
    const evs = ["pointerdown", "keydown", "wheel"] as const;
    evs.forEach((e) => window.addEventListener(e, wake, { passive: true })); wake();
    return () => { clearTimeout(t); evs.forEach((e) => window.removeEventListener(e, wake)); };
  }, []);

  useEffect(() => {
    const key = tabKey();
    let pulling = false;
    const pullCommands = () => {
      if (userRef.current || pulling) return; // signed-in tabs get commands directly
      pulling = true;
      void fetchVisitor({ data: { deviceId: deviceId(), since: since.current } }).then((rows) => {
        for (const r of rows) { since.current = normalizeCommandCursor(r.created_at); handleRef.current(r); }
      }).catch(() => {}).finally(() => { pulling = false; });
    };
    const ch = supabase.channel("site-presence", { config: { presence: { key } } });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<LiveVisitor>();
      visitors = Object.values(state).map((v) => v[0]).filter((v): v is NonNullable<typeof v> => Boolean(v));
      emit();
    }).on("broadcast", { event: "ban-check" }, checkBan)
      .on("broadcast", { event: "device-ping" }, ({ payload }) => {
        const d = (payload as { deviceId?: string }).deviceId;
        if (d === "*" || d === deviceId()) pullCommands();
      })
      .subscribe((s) => { if (s === "SUBSCRIBED") { presence = ch; setChannel(ch); } });
    // Broadcast is a fast hint, not a guarantee: recheck so a missed ping cannot leave a guest trolled or viewed.
    const poll = window.setInterval(pullCommands, 1500);
    return () => { window.clearInterval(poll); presence = null; setChannel(null); void supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (!channel) return;
    const meta = user?.user_metadata as { username?: string; display_name?: string } | undefined;
    void channel.track({
      key: tabKey(), deviceId: deviceId(), userId: user?.id ?? null, path, since: new Date().toISOString(), owner, idle,
      name: user ? meta?.username ?? meta?.display_name ?? user.email?.split("@")[0] ?? "Player" : guest ? "Guest" : "Visitor",
    });
  }, [channel, user, guest, path, owner, idle]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`site-commands-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "site_commands" }, ({ new: c }) => {
        const cmd = c as { kind: string; target: string | null; target_device: string | null; message: string | null; created_by: string };
        if (cmd.target_device) { if (cmd.target_device !== deviceId()) return; }
        else if (cmd.target && cmd.target !== user.id) return;
        if (!cmd.target && !cmd.target_device && cmd.created_by === user.id && cmd.kind !== "message" && cmd.kind !== "announce") return;
        handleRef.current(cmd);
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user]);

  // Live screen share: sends real pictures when possible, with the layout outline as a safe fallback.
  const [controlled, setControlled] = useState(false);
  const viewId = viewing?.id ?? null;
  const sendShareStatus = (status: string) => {
    void shareChannelRef.current?.send({ type: "broadcast", event: "share-status", payload: { status } });
  };
  const stopSharing = () => {
    const stream = streamRef.current;
    streamRef.current = null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
    videoRef.current = null;
    setSharing(false);
    sendShareStatus("stopped");
  };
  const acceptSharing = async () => {
    const request = viewing;
    if (!request?.shareRequest || shareBusy) return;
    setShareBusy(true);
    setAnsweredRequest(request.shareRequest);
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Screen sharing isn't available in this browser.");
      const stream = await requestEntireScreen(navigator.mediaDevices);
      if (viewingRef.current?.id !== request.id || viewingRef.current?.shareRequest !== request.shareRequest) {
        stream.getTracks().forEach((track) => track.stop()); return;
      }
      streamRef.current = stream;
      const video = document.createElement("video");
      video.muted = true; video.srcObject = stream;
      videoRef.current = video;
      await video.play();
      if (streamRef.current !== stream) return;
      stream.getVideoTracks()[0]?.addEventListener("ended", stopSharing, { once: true });
      setSharing(true); sendShareStatus("sharing");
    } catch (error) {
      stopSharing(); sendShareStatus("error");
      toast.error(error instanceof Error ? error.message : "Screen sharing was cancelled.");
    } finally { setShareBusy(false); }
  };
  useEffect(() => {
    if (!viewId) return;
    const ch = supabase.channel(`screen-${viewId}`, { config: { broadcast: { ack: false } } });
    shareChannelRef.current = ch;
    const displayCanvas = document.createElement("canvas");
    let live = true;
    let busy = false;
    let dirty = true;
    let forceBase = true;
    let last = "";
    let lastSent = 0;
    let lastBase = 0;
    let lastFrame: ScreenFrame | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | null = null;
    let controlTimer: ReturnType<typeof setTimeout> | undefined;
    const markDirty = () => { dirty = true; };
    const schedule = (delay = 2200) => {
      if (!live) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!live) return;
        if (document.hidden && !streamRef.current) { schedule(3000); return; }
        if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(() => { idleId = null; void tick(); }, { timeout: 750 });
        else void tick();
      }, delay);
    };
    const tick = async () => {
      if (!live || busy) return;
      busy = true;
      const started = performance.now();
      try {
        const resized = lastFrame && (lastFrame.w !== window.innerWidth || lastFrame.h !== window.innerHeight);
        const sinceBase = Date.now() - lastBase;
        const needsBase = forceBase || !lastFrame || resized || (dirty && sinceBase > 15_000) || sinceBase > 60_000;
        if (needsBase) { dirty = false; forceBase = false; } // Mutations during capture remain dirty for the next pass.
        let frame: ScreenFrame;
        const video = videoRef.current;
        if (streamRef.current && video && video.readyState >= 2 && video.videoWidth && video.videoHeight) {
          displayCanvas.width = Math.min(1280, video.videoWidth);
          displayCanvas.height = Math.round(displayCanvas.width * video.videoHeight / video.videoWidth);
          const context = displayCanvas.getContext("2d");
          if (!context) return;
          context.drawImage(video, 0, 0, displayCanvas.width, displayCanvas.height);
          let shot = displayCanvas.toDataURL("image/jpeg", 0.65);
          if (shot.length > 235_000) shot = displayCanvas.toDataURL("image/jpeg", 0.35);
          frame = { w: video.videoWidth, h: video.videoHeight, path: "Entire screen", bg: "transparent", shot, items: [], entireScreen: true };
          forceBase = true;
        } else if (needsBase) {
          frame = await captureLiveFrame();
          lastFrame = frame; lastBase = Date.now();
        } else {
          const media = captureMediaFrame();
          if (!lastFrame) return;
          frame = media.items.length ? media : lastFrame;
        }
        if (!live) return;
        const json = JSON.stringify(frame);
        if (json === last && Date.now() - lastSent < 10000) return;
        if (json.length < 300_000) {
          last = json; lastSent = Date.now();
          void ch.send({ type: "broadcast", event: "frame", payload: frame });
        }
      } catch { /* captureLiveFrame already falls back */ }
      finally { busy = false; schedule(nextCaptureDelay(performance.now() - started)); }
    };
    const refresh = () => { dirty = true; forceBase = true; last = ""; schedule(0); };
    ch.on("broadcast", { event: "control" }, ({ payload }) => {
      if (streamRef.current) return; // Whole-screen sharing is view-only, never remote desktop control.
      setControlled(true);
      clearTimeout(controlTimer);
      controlTimer = setTimeout(() => setControlled(false), 4000);
      applyControl(payload as ControlEvent);
      requestAnimationFrame(refresh);
      setTimeout(refresh, 180);
    }).on("broadcast", { event: "refresh" }, refresh).subscribe();
    const observer = new MutationObserver(markDirty);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    const visible = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("resize", markDirty);
    window.addEventListener("scroll", markDirty, { passive: true, capture: true });
    const end = setTimeout(() => setViewing(null), 15 * 60 * 1000);
    schedule(0);
    return () => {
      live = false; clearTimeout(timer); clearTimeout(end); clearTimeout(controlTimer);
      if (idleId !== null && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("resize", markDirty);
      window.removeEventListener("scroll", markDirty, { capture: true });
      setControlled(false); void supabase.removeChannel(ch);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
      videoRef.current = null; shareChannelRef.current = null; setSharing(false);
    };
  }, [viewId]);

  if (banned) return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-background" role="alertdialog" aria-label="Banned">
      <div className="max-w-md p-8 text-center">
        <h2 className="text-2xl font-semibold text-foreground">This device is banned</h2>
        <p className="mt-3 text-muted-foreground">The staff has blocked this device from using the site.</p>
      </div>
    </div>
  );
  return <>
    {viewing?.shareRequest && answeredRequest !== viewing.shareRequest && !sharing && <div data-screen-share="skip" className="fixed inset-0 z-[10040] grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
      <section role="alertdialog" aria-modal="true" aria-labelledby="screen-request-title" aria-describedby="screen-request-description" className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xl">
        <MonitorUp className="mb-4 size-8 text-primary" />
        <h2 id="screen-request-title" className="text-lg font-semibold">Share your entire screen?</h2>
        <p id="screen-request-description" className="mt-2 text-sm text-muted-foreground">{viewing.name ?? "Staff"} requested your screen. Anything visible on the screen you choose will be shared, including other apps and personal information. You can stop at any time.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => { setAnsweredRequest(viewing.shareRequest ?? null); sendShareStatus("denied"); }}>Deny</Button>
          <Button disabled={shareBusy} onClick={() => void acceptSharing()}><MonitorUp />Accept & share</Button>
        </div>
      </section>
    </div>}
    {sharing && <div data-screen-share="skip" role="status" className="fixed bottom-3 left-3 z-[10041] flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm text-card-foreground shadow-xl">
      <MonitorUp className="size-4 text-destructive" /><span>Sharing your entire screen with {viewing?.name ?? "Staff"}</span>
      <Button size="sm" variant="destructive" onClick={stopSharing}><Square />Stop sharing</Button>
    </div>}
    {troll && !owner && <TrollLayer key={troll} troll={troll} onEnd={() => setTroll(null)} />}
    {viewing?.notify && <div data-screen-share="skip" className="fixed bottom-2 left-2 z-[9998] rounded-full bg-destructive px-3 py-1 text-xs text-destructive-foreground">{controlled ? `${viewing.name ?? "Staff"} is controlling your screen` : `${viewing.name ?? "Staff"} is viewing your screen`}</div>}
    {announce && (
      <div className="fixed inset-x-0 top-0 z-[9997] flex items-center justify-center gap-3 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg" role="status">
        <span>📢 {announce}</span>
        <button type="button" className="rounded px-2 py-0.5 text-xs underline" onClick={() => setAnnounce(null)}>Dismiss</button>
      </div>
    )}
    {paused && (
      <div className="fixed inset-0 z-[9999] grid place-items-center bg-background/95 backdrop-blur-xl" role="alertdialog" aria-label="Screen paused">
        <div className="max-w-md p-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Screen paused</h2>
          <p className="mt-3 text-muted-foreground">{paused}</p>
        </div>
      </div>
    )}
  </>;
}
