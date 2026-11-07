import { Rnd } from "react-rnd";
import { X } from "lucide-react";
import { usePrefs } from "@/lib/astra/prefs";
import { closeMiniPlayer, useMiniPlayer } from "@/lib/pip";
import { ProxiedFrame } from "@/components/windows/views/WebView";

/** Floating mini player that survives layout and page changes. */
export default function MiniPlayer() {
  const player = useMiniPlayer();
  const prefs = usePrefs();
  if (!player) return null;
  const framePrefs = prefs.transport === "astra" ? { ...prefs, transport: "libcurl" as const } : prefs;
  const w = Math.min(420, window.innerWidth - 24), h = Math.round(w * 0.62) + 32;
  return <div className="mini-player-layer" aria-label="Mini player">
    <Rnd bounds="parent" default={{ x: window.innerWidth - w - 16, y: window.innerHeight - h - 90, width: w, height: h }} minWidth={240} minHeight={170} lockAspectRatio={false} dragHandleClassName="mini-player-handle" cancel="button" className="mini-player">
      <div className="flex size-full flex-col overflow-hidden">
        <div className="mini-player-handle flex h-8 shrink-0 cursor-move items-center gap-2 px-3 text-xs font-medium">
          <span className="truncate">{player.title}</span>
          <button type="button" onClick={closeMiniPlayer} className="ml-auto rounded-full p-1 hover:bg-accent" aria-label="Close mini player"><X className="size-3.5"/></button>
        </div>
        <div className="min-h-0 flex-1"><ProxiedFrame key={player.url} url={player.url} title={player.title} prefs={framePrefs} proxyOnly onFail={() => {}}/></div>
      </div>
    </Rnd>
  </div>;
}
