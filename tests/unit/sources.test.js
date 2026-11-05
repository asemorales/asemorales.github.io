import { describe, expect, it } from "vitest";
import { sourceEntry } from "../../src/lib/sources.js";

const card = { kind: "doi", title: "Paper", meta: ["Turing", "1937", "J"], text: "Abstract." };

describe("sourceEntry", () => {
  it("name a paper by its authors, year, and title, without its abstract", () => {
    expect(sourceEntry({ url: "https://doi.org/x", text: "T", card, cited: true })).toEqual({
      text: "Turing, 1937, Paper",
      domain: "doi.org",
      annotation: null,
    });
  });

  it("fall back to the link text", () => {
    expect(sourceEntry({ url: "https://www.x.org/p", text: "T", cited: true }).text).toBe("T");
  });

  it("show a reference's annotation", () => {
    const entry = sourceEntry({ url: "https://doi.org/x", text: "T", card, annotation: "Mine.", cited: true });
    expect(entry).toMatchObject({ annotation: "Mine." });
  });

  it("show nothing below an external link", () => {
    const link = { url: "https://www.x.org/p", text: "T", card, cited: false };
    const bare = { text: "T", domain: "x.org", annotation: null };
    expect(sourceEntry({ ...link, annotation: "Mine." })).toEqual(bare);
    expect(sourceEntry(link)).toEqual(bare);
  });
});
