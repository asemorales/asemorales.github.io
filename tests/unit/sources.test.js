import { describe, expect, it } from "vitest";
import { sourceEntry } from "../../src/lib/sources.js";

const card = { kind: "doi", title: "Paper", meta: ["Turing", "1937", "J"], text: "Abstract." };

describe("sourceEntry", () => {
  it("name a paper by its authors, year, and title, with its abstract", () => {
    expect(sourceEntry({ url: "https://doi.org/x", text: "T", card, cited: true })).toEqual({
      text: "Turing, 1937, Paper",
      domain: "doi.org",
      annotation: null,
      blurb: "Abstract.",
    });
  });

  it("fall back to the link text", () => {
    expect(sourceEntry({ url: "https://www.x.org/p", text: "T", cited: true }).text).toBe("T");
  });

  it("show an external link's annotation, and nothing else below it", () => {
    const link = { url: "https://www.x.org/p", text: "T", card, cited: false };
    expect(sourceEntry({ ...link, annotation: "Mine." })).toEqual({ text: "T", domain: "x.org", annotation: "Mine.", blurb: null });
    expect(sourceEntry(link)).toEqual({ text: "T", domain: "x.org", annotation: null, blurb: null });
  });
});
