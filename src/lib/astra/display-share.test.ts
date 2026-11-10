import { describe, expect, it, vi } from "vitest";
import { requestEntireScreen } from "./display-share";

describe("visitor-approved entire screen", () => {
  it("requests browser permission and returns only an entire-screen stream", async () => {
    const track = { getSettings: () => ({ displaySurface: "monitor" }), stop: vi.fn() };
    const stream = { getVideoTracks: () => [track], getTracks: () => [track] } as unknown as MediaStream;
    const getDisplayMedia = vi.fn().mockResolvedValue(stream);
    expect(await requestEntireScreen({ getDisplayMedia })).toBe(stream);
    expect(getDisplayMedia).toHaveBeenCalledWith({ video: { displaySurface: "monitor", frameRate: { ideal: 2, max: 5 } }, audio: false });
    expect(track.stop).not.toHaveBeenCalled();
  });
  it("stops a tab or window selection instead of sharing it as the entire screen", async () => {
    const stop = vi.fn();
    const track = { getSettings: () => ({ displaySurface: "window" }), stop };
    await expect(requestEntireScreen({ getDisplayMedia: vi.fn().mockResolvedValue({ getVideoTracks: () => [track], getTracks: () => [track] }) })).rejects.toThrow("Entire screen");
    expect(stop).toHaveBeenCalledOnce();
  });
  it("does not share when browser permission is denied", async () => {
    await expect(requestEntireScreen({ getDisplayMedia: vi.fn().mockRejectedValue(new Error("Permission denied")) })).rejects.toThrow("Permission denied");
  });
});