import { createFileRoute } from "@tanstack/react-router";
import { GamePlayView } from "@/components/games/GamePlayView";
import { SiteTabView } from "@/components/windows/views/SiteTabView";
// Full-tab player: opens a game (or, with site=1, any website) through the proxy in its own browser tab.
export const Route = createFileRoute("/_authenticated/play")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { url: string; name: string; site?: 1 } => ({ url: typeof s["url"] === "string" ? s["url"] : "", name: typeof s["name"] === "string" ? s["name"] : "", ...(s["site"] === 1 || s["site"] === "1" ? { site: 1 as const } : {}) }),
  head: () => ({ meta: [{ title: "Playing — BirchBlock" }, { name: "description", content: "Play a browser game in its own tab through BirchBlock." }, { property: "og:title", content: "Playing — BirchBlock" }, { property: "og:description", content: "Play a browser game in its own tab through BirchBlock." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Play,
});

function Play() {
  const { url, name, site } = Route.useSearch();
  return site ? <SiteTabView url={url} name={name}/> : <GamePlayView url={url} name={name}/>;
}
