import { describe, expect, it } from "vitest";
import { photonSocketTarget, prepareBinaryRelay } from "./socket-relay";

describe("arcade Photon relay", () => {
  it("keeps Photon handshake messages binary in both directions", () => {
    const upstream = { binaryType: "blob" }, browser = { binaryType: "blob" };
    prepareBinaryRelay(upstream, browser);
    expect(upstream.binaryType).toBe("arraybuffer");
    expect(browser.binaryType).toBe("arraybuffer");
  });
  it("accepts the actual BuildNow name server and regional servers", () => {
    expect(photonSocketTarget("wss://ns.exitgames.com:19093/?libversion=4.1.6.0&sid=30&app=NameServer")?.port).toBe("19093");
    expect(photonSocketTarget("wss://eu.exitgames.com:19090/")?.hostname).toBe("eu.exitgames.com");
  });
  it("rejects non-Photon hosts and insecure connections", () => {
    expect(photonSocketTarget("wss://exitgames.com.evil.example/")).toBeNull();
    expect(photonSocketTarget("ws://ns.exitgames.com:9093/")).toBeNull();
    expect(photonSocketTarget("wss://user:pass@ns.exitgames.com/")).toBeNull();
  });
});