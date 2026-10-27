import { describe, expect, it } from "vitest";
import { matcher } from "../../src/lib/search.js";

describe("search", () => {
  it("matches every word, in any order, ignoring case and accents", () => {
    const match = matcher("  rice THEOREM ");
    expect(match("Rice's theorem, from Henry Gordon Rice")).toBe(true);
    expect(match("The halting problem")).toBe(false);
    expect(matcher("godel")("Gödel's incompleteness theorems")).toBe(true);
  });

  it("matches everything for an empty query", () => {
    expect(matcher("   ")("anything")).toBe(true);
  });
});
