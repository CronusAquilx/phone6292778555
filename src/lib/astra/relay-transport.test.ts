import { afterEach, describe, expect, it, vi } from "vitest";
import { AstraRelayTransport } from "./relay-transport";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: vi.fn(async () => ({ data: { session: null } })) } } }));
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("relay recovery", () => {
  it("does not repeat denied requests", async () => {
    const fetcher = vi.fn(async () => new Response("Denied", { status: 401 }));
    vi.stubGlobal("fetch", fetcher);
    await expect(new AstraRelayTransport().request(new URL("https://example.com"), "GET", null, [], undefined)).rejects.toThrow("401");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("retries transient errors but never repeats mutations", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn(async () => new Response("Unavailable", { status: 503 }));
    vi.stubGlobal("fetch", fetcher);
    const request = new AstraRelayTransport().request(new URL("https://example.com"), "GET", null, [], undefined);
    const rejected = expect(request).rejects.toThrow("503");
    await vi.runAllTimersAsync();
    await rejected;
    expect(fetcher).toHaveBeenCalledTimes(4);
    fetcher.mockClear();
    await expect(new AstraRelayTransport().request(new URL("https://example.com"), "POST", "data", [], undefined)).rejects.toThrow("503");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("stops pending retries immediately when a page is closed", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn(async () => new Response("Unavailable", { status: 503 }));
    vi.stubGlobal("fetch", fetcher);
    const abort = new AbortController();
    const request = new AstraRelayTransport().request(new URL("https://example.com"), "GET", null, [], abort.signal);
    const rejected = expect(request).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(1);
    abort.abort();
    await rejected;
    await vi.runAllTimersAsync();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});