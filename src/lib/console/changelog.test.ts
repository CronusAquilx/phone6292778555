import { beforeEach, describe, expect, it } from "vitest";
import { bypassesChangelog, CURRENT_CHANGELOG_VERSION, markChangelogSeen, shouldShowChangelog } from "./changelog";

describe("device changelog", () => {
  beforeEach(() => localStorage.clear());

  it("shows once per device and remembers dismissal", () => {
    expect(shouldShowChangelog(localStorage)).toBe(true);
    markChangelogSeen(localStorage);
    expect(shouldShowChangelog(localStorage)).toBe(false);
  });

  it("can announce a newer version without repeating the current one", () => {
    markChangelogSeen(localStorage);
    expect(shouldShowChangelog(localStorage, CURRENT_CHANGELOG_VERSION)).toBe(false);
    expect(shouldShowChangelog(localStorage, "next-update")).toBe(true);
  });

  it("does not block visitors when device storage is unavailable", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(shouldShowChangelog(blocked)).toBe(false);
    expect(() => markChangelogSeen(blocked)).not.toThrow();
  });

  it("keeps standalone gameplay and proxied pages outside the opening notice", () => {
    expect(bypassesChangelog("/play")).toBe(true);
    expect(bypassesChangelog("/guest-play")).toBe(true);
    expect(bypassesChangelog("/scramjet/example")).toBe(true);
    expect(bypassesChangelog("/")).toBe(false);
  });
});
