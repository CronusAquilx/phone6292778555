import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Mode = "home" | "school";

/** Movies network mode: home uses every source, school sticks to the unblocked one. */
export function WatchModeSetting() {
  const [mode, setMode] = useState<Mode>("home");
  useEffect(() => { setMode(localStorage.getItem("astra-watch-mode") === "school" ? "school" : "home"); }, []);
  const pick = (next: Mode) => {
    localStorage.setItem("astra-watch-mode", next);
    sessionStorage.setItem("astra-watch-mode-asked", "1");
    setMode(next);
  };
  return (
    <div className="flex gap-2">
      {(["home", "school"] as const).map(m => (
        <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => pick(m)}>
          {m === "home" ? "At home" : "At school"}
        </Button>
      ))}
    </div>
  );
}
