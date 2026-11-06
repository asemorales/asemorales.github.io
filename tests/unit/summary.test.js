import { describe, expect, it } from "vitest";
import { slugify } from "../../src/lib/slug.js";
import { summary } from "../../src/lib/summary.js";

describe("summary", () => {
  it("takes the opening paragraphs up to the first block", () => {
    const md = "First *one* with [a link](https://x.org) and [[Note|an alias]].[^1]\n\nSecond.\n\n> [!status]\n> Not part of it.\n\nAfter.";
    expect(summary(md)).toEqual(["First one with a link and an alias.", "Second."]);
    expect(summary(md, { paragraphs: 1 })).toEqual(["First one with a link and an alias."]);
  });

  it("leaves inline math as written", () => {
    expect(summary("Let $\\varphi_e$ be *the* $e$-th function.")).toEqual(["Let $\\varphi_e$ be the $e$-th function."]);
  });

  it("is empty when the note opens with a heading", () => {
    expect(summary("## Heading\n\nText.")).toEqual([]);
  });
});

describe("slugify", () => {
  it.each([
    ["Lorem Ipsum", "lorem-ipsum"],
    ["Rice's Theorem", "rices-theorem"],
    ["Gödel  Numbering", "godel-numbering"],
    ["P vs. NP?", "p-vs-np"],
  ])("%s -> %s", (name, slug) => expect(slugify(name)).toBe(slug));
});
