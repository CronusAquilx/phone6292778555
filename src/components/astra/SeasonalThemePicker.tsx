import { Leaf, Snowflake, Power, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setSeasonalTheme, usePrefs } from "@/lib/astra/prefs";

const THEMES = [
  { id: "christmas", label: "Christmas", icon: Snowflake },
  { id: "thanksgiving", label: "Thanksgiving", icon: Leaf },
  { id: "neither", label: "Neither", icon: Power },
] as const;
export function SeasonalThemePicker() {
  const { seasonalTheme } = usePrefs();
  return <section className="seasonal-theme-picker" aria-label="Themes">
    <h2 className="text-sm font-medium">Themes</h2>
    <div className="seasonal-theme-options">
      {THEMES.map(({ id, label, icon: Icon }) => <Button key={id} variant="outline" aria-pressed={seasonalTheme === id} data-season-choice={id} onClick={() => setSeasonalTheme(id)} className="seasonal-theme-option">
        <Icon className="size-4 shrink-0"/><span>{label}</span><Check aria-hidden="true" className={`seasonal-choice-check size-3.5 ${seasonalTheme === id ? "opacity-100" : "opacity-0"}`}/>
      </Button>)}
    </div>
  </section>;
}