import { describe, expect, it } from "vitest";
import { crossed, depth } from "../../src/lib/reading.js";

describe("reading depth", () => {
  it("measure the prose read from its top to the viewport's bottom", () => {
    expect(depth(0, 2000, 1000)).toBe(50);
    expect(depth(-1500, 500, 1000)).toBe(125);
    expect(depth(200, 1200, 800)).toBe(60);
  });

  it("report each threshold once per view", () => {
    const sent = new Set();
    expect(crossed(30, sent)).toEqual([25]);
    expect(crossed(30, sent)).toEqual([]);
    expect(crossed(95, sent)).toEqual([50, 75, 90]);
    expect(crossed(100, sent)).toEqual([]);
  });

  it("report every threshold at once for a note that fits on screen", () => {
    expect(crossed(depth(100, 400, 900), new Set())).toEqual([25, 50, 75, 90]);
  });
});
