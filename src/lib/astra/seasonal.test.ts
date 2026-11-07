import { describe, expect, it } from "vitest";
import { seasonalMotionEnabled, seasonalThemeForPath } from "./seasonal";
describe("seasonal presentation rules", () => {
  it("applies themes to movie, music, browser and desktop menus, excluding standalone games", () => {
    for (const path of ["/", "/desktop", "/movies", "/music", "/browser", "/console"]) {
      expect(seasonalThemeForPath("christmas", path)).toBe("christmas");
      expect(seasonalThemeForPath("thanksgiving", path)).toBe("thanksgiving");
    }
    expect(seasonalThemeForPath("christmas", "/play")).toBe("neither");
    expect(seasonalThemeForPath("thanksgiving", "/play/game")).toBe("neither");
  });
  it("keeps selected seasonal motion visible in low-power mode while respecting reduced motion", () => {
    expect(seasonalMotionEnabled(false, false, false)).toBe(true);
    expect(seasonalMotionEnabled(true, false, false)).toBe(false);
    expect(seasonalMotionEnabled(false, true, false)).toBe(true);
    expect(seasonalMotionEnabled(false, false, true)).toBe(false);
  });
});