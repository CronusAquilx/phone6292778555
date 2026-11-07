export type SeasonalTheme = "neither" | "christmas" | "thanksgiving";
export function seasonalThemeForPath(theme: SeasonalTheme, pathname: string): SeasonalTheme {
  return pathname === "/play" || pathname.startsWith("/play/") ? "neither" : theme;
}
export function seasonalMotionEnabled(reduceMotion: boolean, perfMode: boolean, systemReduced: boolean) {
  // Selecting a season explicitly enables its bounded effect even in low-power mode.
  // Accessibility motion preferences still take precedence.
  return !reduceMotion && !systemReduced;
}