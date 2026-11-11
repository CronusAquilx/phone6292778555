import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/astra/AdminDashboard";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Dev dashboard \u2014 BirchBlock" }, { name: "description", content: "Manage BirchBlock model providers, tools and usage for developer accounts." }, { property: "og:title", content: "Dev dashboard \u2014 BirchBlock" }, { property: "og:description", content: "Manage BirchBlock model providers, tools and usage for developer accounts." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AdminDashboard,
});
