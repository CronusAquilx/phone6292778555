export type SeasonalTheme = "neither" | "christmas" | "thanksgiving";
export function seasonalThemeForPath(theme: SeasonalTheme, pathname: string): SeasonalTheme {
  return pathname === "/play" || pathname.startsWith("/play/") ? "neither" : theme;
}
export function seasonalMotionEnabled(reduceMotion: boolean, perfMode: boolean, systemReduced: boolean) {
  // Explicitly selecting a season always shows its particles; reduced-motion settings
  // never hide or weaken it.
  void reduceMotion; void perfMode; void systemReduced;
  return true;
}