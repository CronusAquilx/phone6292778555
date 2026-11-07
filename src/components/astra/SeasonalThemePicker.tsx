import { Leaf, Snowflake, Power, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setSeasonalAmount, setSeasonalTheme, usePrefs } from "@/lib/astra/prefs";
import { Slider } from "@/components/ui/slider";

const THEMES = [
  { id: "christmas", label: "Christmas", icon: Snowflake },
  { id: "thanksgiving", label: "Thanksgiving", icon: Leaf },
  { id: "neither", label: "Neither", icon: Power },
] as const;
export function SeasonalThemePicker() {
  const { seasonalTheme, seasonalSnowAmount, seasonalLeafAmount } = usePrefs();
  return <section className="seasonal-theme-picker" aria-label="Themes">
    <h2 className="text-sm font-medium">Themes</h2>
    <div className="seasonal-theme-options">
      {THEMES.map(({ id, label, icon: Icon }) => <Button key={id} variant="outline" aria-pressed={seasonalTheme === id} data-season-choice={id} onClick={() => setSeasonalTheme(id)} className="seasonal-theme-option">
        <Icon className="size-4 shrink-0"/><span>{label}</span><Check aria-hidden="true" className={`seasonal-choice-check size-3.5 ${seasonalTheme === id ? "opacity-100" : "opacity-0"}`}/>
      </Button>)}
    </div>
    {seasonalTheme !== "neither" && <div className="mt-3 flex items-center gap-3 text-sm">
      <span className="shrink-0">{seasonalTheme === "christmas" ? "Snowfall" : "Falling leaves"}</span>
      <Slider aria-label={seasonalTheme === "christmas" ? "Snow amount" : "Leaf amount"} min={0} max={100} step={10} value={[seasonalTheme === "christmas" ? seasonalSnowAmount : seasonalLeafAmount]} onValueChange={values => setSeasonalAmount(seasonalTheme, values[0] ?? 0)}/>
      <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">{(seasonalTheme === "christmas" ? seasonalSnowAmount : seasonalLeafAmount) || "Off"}{(seasonalTheme === "christmas" ? seasonalSnowAmount : seasonalLeafAmount) > 0 ? "%" : ""}</span>
      <Button variant="ghost" size="icon" aria-label="Turn particles off" title="Turn particles off" onClick={() => setSeasonalAmount(seasonalTheme, 0)}><Power className="size-4"/></Button>
    </div>}
  </section>;
}