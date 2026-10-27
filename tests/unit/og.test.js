import { describe, expect, it } from "vitest";
import { firstSentence, HEIGHT, ogImage, WIDTH } from "../../src/lib/og.js";

describe("firstSentence", () => {
  it("takes the first sentence", () => {
    expect(firstSentence("One thing. Another thing.")).toBe("One thing.");
  });

  it("keeps a sentence with no end whole", () => {
    expect(firstSentence("No full stop here")).toBe("No full stop here");
  });

  it("drops the dollar signs around inline math", () => {
    expect(firstSentence("Let $\\varphi_e$ be a function. More.")).toBe("Let \\varphi_e be a function.");
  });
});

describe("ogImage", () => {
  it("draws a 1200 × 630 PNG", async () => {
    const png = await ogImage({ title: "Lorem Ipsum", text: "This paragraph tests the note's summary." });
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    // The IHDR chunk holds width and height as big-endian integers.
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([WIDTH, HEIGHT]);
  });
});
