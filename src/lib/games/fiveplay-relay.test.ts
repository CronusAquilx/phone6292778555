import { describe, expect, it } from "vitest";
import { fiveplayUpstreamPath, rewriteFiveplay } from "../../routes/api/public/fp.$";

describe("FivePlay Story loading rewrites", () => {
  it("preserves engine filesystem paths and separator strings", () => {
    const script = "mkdir('/userdata');open('/dev/null');path.split('/');";
    expect(rewriteFiveplay(script, false)).toBe(script);
  });
  it("resolves dynamically joined graphics and streaming worker filenames within their build", () => {
    expect(fiveplayUpstreamPath("/b/8b0b5899ed/api/public/fp/wgpu.movie.js")).toBe("/b/8b0b5899ed/wgpu.movie.js");
    expect(fiveplayUpstreamPath("/b/8b0b5899ed/api/public/fp/io_worker.js")).toBe("/b/8b0b5899ed/io_worker.js");
    expect(fiveplayUpstreamPath("/data/manifest.json")).toBe("/data/manifest.json");
  });
  it("keeps diagnostic regexes valid so GTAClientLogs initializes", () => {
    const script = 'if(/BC textures:|"gpuValidation"|"textureUseDiagnostic"/.test(text)){ready=true;}';
    expect(rewriteFiveplay(script, false)).toBe(script);
  });
  it("prefixes the build once without corrupting worker suffixes", () => {
    const script = "const BASE='/b/8b0b5899ed';new Worker(BASE + '/loader.js?mode=story');fetch('/data/manifest.json');";
    expect(rewriteFiveplay(script, false)).toBe("const BASE='/api/public/fp/b/8b0b5899ed';new Worker(BASE + '/loader.js?mode=story');fetch('/api/public/fp/data/manifest.json');");
  });
  it("leaves already relayed paths unchanged", () => {
    expect(rewriteFiveplay("fetch('/api/public/fp/data/manifest.json')", false)).toBe("fetch('/api/public/fp/data/manifest.json')");
  });
  it("keeps the data manifest on the relay when joined to the current origin", () => {
    expect(rewriteFiveplay("base: self.location.origin + '/data/'", false)).toBe("base: self.location.origin + '/api/public/fp/data/'");
  });
});