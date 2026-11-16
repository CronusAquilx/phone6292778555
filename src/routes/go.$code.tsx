import { createFileRoute, redirect } from "@tanstack/react-router";

/** Generated share links: any /go/<code> sends the visitor to the home page. */
export const Route = createFileRoute("/go/$code")({
  beforeLoad: () => { throw redirect({ to: "/" }); },
  head: () => ({ meta: [
    { title: "Birch OS — Opening" },
    { name: "description", content: "Opening Birch OS." },
    { property: "og:title", content: "Birch OS" },
    { property: "og:description", content: "Opening Birch OS." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});
