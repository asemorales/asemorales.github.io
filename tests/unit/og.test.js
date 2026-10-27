import { describe, expect, it } from "vitest";
import { HEIGHT, ogImage, WIDTH } from "../../src/lib/og.js";

describe("ogImage", () => {
  it("draws a 1200 × 630 PNG", async () => {
    const png = await ogImage({ title: "Lorem Ipsum" });
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    // The IHDR chunk holds width and height as big-endian integers.
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([WIDTH, HEIGHT]);
  });
});
