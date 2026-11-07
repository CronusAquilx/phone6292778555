export type SeasonalTheme = "neither" | "christmas" | "thanksgiving";
export function seasonalParticleCount(theme: SeasonalTheme, amount: number, width: number, perfMode: boolean): number {
  if (theme === "neither") return 0;
  const full = theme === "christmas" ? Math.min(perfMode ? 100 : 240, Math.round(width / 5)) : Math.min(perfMode ? 24 : 60, Math.round(width / 20));
  return Math.round(full * Math.max(0, Math.min(100, amount)) / 100);
}
export function seasonalThemeForPath(theme: SeasonalTheme, pathname: string): SeasonalTheme {
  return pathname === "/play" || pathname.startsWith("/play/") ? "neither" : theme;
}
export function seasonalMotionEnabled(reduceMotion: boolean, perfMode: boolean, systemReduced: boolean) {
  // Explicitly selecting a season always shows its particles; reduced-motion settings
  // never hide or weaken it.
  void reduceMotion; void perfMode; void systemReduced;
  return true;
}