import { afterEach, describe, expect, it, vi } from "vitest";
import { fromBase64, toBase64 } from "../src/utils/base64";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("base64 helpers", () => {
  it("uses the browser globals when available", () => {
    expect(toBase64("Palm Beach, Florida")).toBe("UGFsbSBCZWFjaCwgRmxvcmlkYQ==");
    expect(fromBase64("UGFsbSBCZWFjaCwgRmxvcmlkYQ==")).toBe("Palm Beach, Florida");
  });

  it("falls back to Buffer when browser globals are unavailable", () => {
    vi.stubGlobal("btoa", undefined);
    vi.stubGlobal("atob", undefined);

    expect(toBase64("Palm Beach, Florida")).toBe("UGFsbSBCZWFjaCwgRmxvcmlkYQ==");
    expect(fromBase64("UGFsbSBCZWFjaCwgRmxvcmlkYQ==")).toBe("Palm Beach, Florida");
  });
});
