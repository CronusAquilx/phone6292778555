import { describe, expect, it } from "vitest";
import { applyIconOrder, moveIcon } from "./icon-order";
describe("desktop icon order", () => {
  it("keeps the saved order and appends newly installed apps", () => {
    expect(applyIconOrder(["music", "web", "gone"], ["web", "music", "twitch"])).toEqual(["music", "web", "twitch"]);
  });
  it("moves a dragged icon onto another icon's spot", () => {
    expect(moveIcon(["a", "b", "c", "d"], "a", "c")).toEqual(["b", "c", "a", "d"]);
    expect(moveIcon(["a", "b", "c", "d"], "d", "b")).toEqual(["a", "d", "b", "c"]);
  });
});
