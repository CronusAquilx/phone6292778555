import { createFileRoute } from "@tanstack/react-router";
import { WebView } from "@/components/windows/views/WebView";
import { toolById } from "@/lib/windows/tool-apps";

export const Route = createFileRoute("/_authenticated/app/$id")({
  head: ({ params }) => {
    const title = `${toolById(params.id)?.title ?? "App"} — Birch OS`;
    const description = "Open this web app through the Birch OS proxy.";
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  component: WebAppPage,
});

function WebAppPage() {
  const { id } = Route.useParams();
  const app = toolById(id);
  if (!app?.url) return <div className="flex h-full items-center justify-center text-muted-foreground">App not found.</div>;
  return <WebView key={app.id} initialSite={app.url} proxyOnly app appTitle={app.title} />;
}
