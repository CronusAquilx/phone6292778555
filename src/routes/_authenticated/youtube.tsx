import { createFileRoute } from "@tanstack/react-router";
import { YouTubeView } from "@/components/windows/views/YouTubeView";

export const Route = createFileRoute("/_authenticated/youtube")({
  head: () => ({ meta: [
    { title: "YouTube — Birch OS" },
    { name: "description", content: "Watch YouTube videos and live streams in your Birch OS browser." },
    { property: "og:title", content: "YouTube — Birch OS" },
    { property: "og:description", content: "Watch YouTube videos and live streams in your Birch OS browser." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: YouTubeView,
});