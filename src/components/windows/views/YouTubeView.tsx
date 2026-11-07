import { WebView } from "./WebView";
import { YOUTUBE_URL } from "@/lib/windows/youtube";

export function YouTubeView() {
  return <WebView initialSite={YOUTUBE_URL} proxyOnly app/>;
}