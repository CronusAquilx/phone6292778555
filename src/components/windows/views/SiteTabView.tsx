import { useEffect, useState } from "react";
import { MapPin, RotateCw } from "lucide-react";
import { usePrefs } from "@/lib/astra/prefs";
import { signInModeOn } from "@/lib/astra/signin-mode";
import { ProxiedFrame, requestLocation } from "@/components/windows/views/WebView";

/** A proxied site shown alone in its own browser tab (opened from the web app's new-tab button). */
export function SiteTabView({ url, name }: { url: string; name: string }) {
  const prefs = usePrefs();
  const [nonce, setNonce] = useState(0);
  const [fallback, setFallback] = useState(false);
  const signIn = signInModeOn(url) && !fallback;
  const framePrefs = signIn && prefs.transport === "astra" ? { ...prefs, transport: "epoxy" as const } : prefs;
  useEffect(() => { try { document.title = `${name || new URL(url).hostname} — BirchBlock`; } catch { /* invalid url */ } }, [url, name]);
  if (!/^https?:\/\//i.test(url)) return <p className="p-6 text-sm text-muted-foreground">No website to open.</p>;
  return (
    <div className="flex h-dvh flex-col bg-background">
      <div className="flex items-center gap-1 border-b bg-card px-2 py-1 text-xs text-muted-foreground">
        <button type="button" onClick={() => setNonce((n) => n + 1)} className="rounded-full p-1.5 hover:bg-accent hover:text-foreground" aria-label="Reload" title="Reload"><RotateCw className="size-4" /></button>
        <span className="truncate font-medium">{name || url}</span>
        <span className="ml-auto" />
        <button type="button" onClick={requestLocation} className="rounded-full p-1.5 hover:bg-accent hover:text-foreground" aria-label="Share my location" title="Share my location with this site"><MapPin className="size-4" /></button>
      </div>
      <div className="min-h-0 flex-1">
        <ProxiedFrame key={`${url}#${nonce}#${fallback}`} url={url} title={name || url} prefs={framePrefs} proxyOnly onFail={() => {}} onConnectionFail={signIn ? () => setFallback(true) : undefined} />
      </div>
    </div>
  );
}
