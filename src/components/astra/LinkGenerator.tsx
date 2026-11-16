import { useState } from "react";
import { Button } from "@/components/ui/button";

const code = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);

/** Makes unlimited unique links that all open this site. */
export function LinkGenerator() {
  const [links, setLinks] = useState<string[]>([]);
  const make = (n: number) => setLinks(l => [...Array.from({ length: n }, () => `${window.location.origin}/go/${code()}`), ...l].slice(0, 50));
  const copy = (t: string) => navigator.clipboard?.writeText(t);
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-2">
        <Button size="sm" onClick={() => make(1)}>New link</Button>
        <Button size="sm" variant="outline" onClick={() => make(10)}>Make 10</Button>
        {links.length > 0 && <Button size="sm" variant="outline" onClick={() => copy(links.join("\n"))}>Copy all</Button>}
      </div>
      {links.map(l => (
        <button key={l} onClick={() => copy(l)} className="text-left text-xs truncate rounded border border-border px-2 py-1 hover:bg-muted" title="Click to copy">{l}</button>
      ))}
    </div>
  );
}
