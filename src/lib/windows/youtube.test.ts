import { describe, expect, it } from "vitest";
import { YOUTUBE_URL } from "./youtube";
import { STORE_APPS } from "./store-catalog";
import { streamingApp } from "@/lib/console/streaming";

describe("YouTube app destination", () => {
  it("uses the same real HTTPS destination as the console streaming catalog", () => {
    expect(YOUTUBE_URL).toBe("https://www.youtube.com/");
    expect(streamingApp("youtube")?.url).toBe(YOUTUBE_URL);
  });
  it("is included in the shared desktop store", () => {
    expect(STORE_APPS.find(app => app.id === "youtube")?.category).toBe("Entertainment");
  });
});