import { useState } from "react";
import { Library, Search, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppIcon } from "@/components/astra/AppIcon";
import { useHomeScreen } from "@/lib/windows/home-screen";
import type { DesktopApp } from "@/lib/windows/window-model";

type OwnedApp = { id: DesktopApp; title: string; tone: string };
export function AppLibraryView({ apps, onOpen }: { apps: OwnedApp[]; onOpen: (id: DesktopApp) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All apps");
  const home = useHomeScreen();
  const owned = apps.filter(a => a.id !== "home");
  const results = owned.filter(a => a.title.toLowerCase().includes(query.toLowerCase()) && (filter === "All apps" || home.has(a.id) === (filter === "On home screen")));
  return <div className="desktop-store"><header className="store-header"><div className="native-app-wordmark"><Library/>Library <span className="text-xs text-muted-foreground">{owned.length} owned</span></div><div className="relative min-w-0"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground"/><Input aria-label="Search library" placeholder="Search your apps" className="pl-10" value={query} onChange={e => setQuery(e.target.value)}/></div></header><nav className="store-categories">{["All apps", "On home screen", "Not on home screen"].map(value => <Button key={value} variant={filter === value ? "secondary" : "ghost"} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</Button>)}</nav><main className="store-content"><div className="store-app-grid">{results.map(app => { const shown = home.has(app.id); return <article className="store-app library-app" key={app.id}><span className="desktop-color-icon store-icon" data-tone={app.tone}><AppIcon app={app.id}/></span><div className="min-w-0"><h3>{app.title}</h3><p className="mt-1 text-xs text-muted-foreground">{shown ? "On home screen" : "Library only"}</p></div><div className="library-app-actions"><Button size="sm" variant="secondary" onClick={() => onOpen(app.id)}>Open</Button><Button size="sm" variant="ghost" aria-label={`${shown ? "Remove" : "Add"} ${app.title} ${shown ? "from" : "to"} home screen`} onClick={() => home.set(app.id, !shown)}>{shown ? <Minus/> : <Plus/>}{shown ? "Remove from home" : "Add to home"}</Button></div></article>; })}</div>{!results.length && <p className="py-12 text-center text-muted-foreground">No apps found</p>}</main></div>;
}