import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { loadSiteConfig } from "@/lib/astra/site-config";
import { applyExtras, DEFAULT_EXTRAS, loadExtras, saveExtras, type LookExtras } from "@/lib/astra/look-extras";

export function LookExtrasApplier() { useEffect(() => { applyExtras(loadExtras()); loadSiteConfig(); }, []); return null; }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b py-3"><span className="text-sm">{label}</span>{children}</div>;
}
function Choice<T extends string>({ value, options, onPick }: { value: T; options: [T, string][]; onPick: (v: T) => void }) {
  return <div className="flex flex-wrap gap-1">{options.map(([v, l]) => <Button key={v} size="sm" variant={value === v ? "secondary" : "ghost"} aria-pressed={value === v} onClick={() => onPick(v)}>{l}</Button>)}</div>;
}

export function LookExtrasControls() {
  const [x, setX] = useState<LookExtras>(DEFAULT_EXTRAS);
  useEffect(() => setX(loadExtras()), []);
  const set = (p: Partial<LookExtras>) => { const n = { ...x, ...p }; setX(n); saveExtras(n); };
  return <section aria-label="More personalization" className="py-2">
    <h3 className="pt-4 text-sm font-medium">More personalization</h3>
    <Row label="Cursor"><Choice value={x.cursor} options={[["default","Normal"],["large","Large"],["pointer-dot","Dot"]]} onPick={cursor => set({ cursor })}/></Row>
    <Row label={`Color intensity · ${x.saturation}%`}><Slider aria-label="Color intensity" className="w-44" min={50} max={150} step={10} value={[x.saturation]} onValueChange={v => set({ saturation: v[0] ?? 100 })}/></Row>
    <Row label="Contrast"><Choice value={x.contrast} options={[["normal","Normal"],["high","High"]]} onPick={contrast => set({ contrast })}/></Row>
    <Row label="Black & white"><Choice value={x.grayscale ? "on" : "off"} options={[["off","Off"],["on","On"]]} onPick={v => set({ grayscale: v === "on" })}/></Row>
    <Row label="Bold text"><Choice value={x.boldText ? "on" : "off"} options={[["off","Off"],["on","On"]]} onPick={v => set({ boldText: v === "on" })}/></Row>
    <Row label="Text glow"><Choice value={x.textShadow ? "on" : "off"} options={[["off","Off"],["on","On"]]} onPick={v => set({ textShadow: v === "on" })}/></Row>
    <Row label={`Letter spacing · ${x.letterSpacing}`}><Slider aria-label="Letter spacing" className="w-44" min={-1} max={3} step={1} value={[x.letterSpacing]} onValueChange={v => set({ letterSpacing: v[0] ?? 0 })}/></Row>
    <Row label="Highlight color"><Choice value={x.selection} options={[["accent","Accent"],["pink","Pink"],["lime","Lime"],["orange","Orange"]]} onPick={selection => set({ selection })}/></Row>
    <Row label="Scrollbars"><Choice value={x.scrollbars} options={[["normal","Normal"],["thin","Thin"],["hidden","Hidden"]]} onPick={scrollbars => set({ scrollbars })}/></Row>
    <Row label="Animation speed"><Choice value={x.animationSpeed} options={[["slow","Slow"],["normal","Normal"],["fast","Fast"]]} onPick={animationSpeed => set({ animationSpeed })}/></Row>
    <Row label="Focus outline"><Choice value={x.focusRing} options={[["normal","Normal"],["bold","Bold"]]} onPick={focusRing => set({ focusRing })}/></Row>
    <Row label="Smooth mode (less blur, keeps animations)"><Choice value={x.smoothMode ? "on" : "off"} options={[["off","Off"],["on","On"]]} onPick={v => set({ smoothMode: v === "on" })}/></Row>
    <Row label={`Brightness · ${x.brightness}%`}><Slider aria-label="Brightness" className="w-44" min={70} max={130} step={5} value={[x.brightness]} onValueChange={v => set({ brightness: v[0] ?? 100 })}/></Row>
    <Row label={`Warm tint · ${x.warmth}%`}><Slider aria-label="Warm tint" className="w-44" min={0} max={60} step={5} value={[x.warmth]} onValueChange={v => set({ warmth: v[0] ?? 0 })}/></Row>
    <Row label={`Color shift · ${x.hueShift}°`}><Slider aria-label="Color shift" className="w-44" min={0} max={360} step={15} value={[x.hueShift]} onValueChange={v => set({ hueShift: v[0] ?? 0 })}/></Row>
    <Row label="Font"><Choice value={x.fontFamily} options={[["default","Default"],["serif","Serif"],["mono","Mono"],["rounded","Rounded"],["handwritten","Handwritten"]]} onPick={fontFamily => set({ fontFamily })}/></Row>
    <Row label="Line spacing"><Choice value={x.lineHeight} options={[["tight","Tight"],["normal","Normal"],["loose","Loose"]]} onPick={lineHeight => set({ lineHeight })}/></Row>
    <Row label={`Word spacing · ${x.wordSpacing}`}><Slider aria-label="Word spacing" className="w-44" min={0} max={4} step={1} value={[x.wordSpacing]} onValueChange={v => set({ wordSpacing: v[0] ?? 0 })}/></Row>
    <Row label="Text alignment"><Choice value={x.textAlign} options={[["default","Default"],["center","Centered"]]} onPick={textAlign => set({ textAlign })}/></Row>
    <Row label="Underline links"><Choice value={x.underlineLinks ? "on" : "off"} options={[["off","Off"],["on","On"]]} onPick={v => set({ underlineLinks: v === "on" })}/></Row>
    <Row label="Uppercase headings"><Choice value={x.uppercaseHeadings ? "on" : "off"} options={[["off","Off"],["on","On"]]} onPick={v => set({ uppercaseHeadings: v === "on" })}/></Row>
    <Row label="Rounded pictures"><Choice value={x.roundImages ? "on" : "off"} options={[["off","Off"],["on","On"]]} onPick={v => set({ roundImages: v === "on" })}/></Row>
    <Row label="Typing cursor"><Choice value={x.caret} options={[["default","Normal"],["accent","Accent color"],["thick","Thick"]]} onPick={caret => set({ caret })}/></Row>
    <Row label="Pictures"><Choice value={x.imageStyle} options={[["normal","Normal"],["vivid","Vivid"],["soft","Soft"]]} onPick={imageStyle => set({ imageStyle })}/></Row>
    <Row label="Button shape"><Choice value={x.buttonStyle} options={[["default","Default"],["pill","Pill"],["square","Square"]]} onPick={buttonStyle => set({ buttonStyle })}/></Row>
    <Row label="Shadows"><Choice value={x.shadows} options={[["normal","Normal"],["none","None"],["deep","Deep"]]} onPick={shadows => set({ shadows })}/></Row>
    <Row label="Borders"><Choice value={x.borders} options={[["normal","Normal"],["thick","Thick"],["none","None"]]} onPick={borders => set({ borders })}/></Row>
    <div className="pt-3"><Button size="sm" variant="ghost" onClick={() => set(DEFAULT_EXTRAS)}>Reset these</Button></div>
  </section>;
}
