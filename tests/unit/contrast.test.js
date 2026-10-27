import fs from "node:fs";
import { describe, expect, it } from "vitest";

const css = fs.readFileSync(new URL("../../src/styles/global.css", import.meta.url), "utf8");
const tokens = Object.fromEntries([...css.matchAll(/--([\w-]+): light-dark\((#\w{6}), (#\w{6})\)/g)].map((m) => [m[1], [m[2], m[3]]]));

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [lo, hi] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (hi + 0.05) / (lo + 0.05);
};

describe("room contrast", () => {
  it.each(["ink", "dim", "link", "link-dead", "link-hover", "link-dead-hover"])("keeps %s at 4.5:1 on the page in both rooms", (name) => {
    for (const room of [0, 1]) expect(contrast(tokens[name][room], tokens.page[room])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps dim text at 4.5:1 on code blocks and the contents box", () => {
    for (const room of [0, 1]) expect(contrast(tokens.dim[room], tokens.code[room])).toBeGreaterThanOrEqual(4.5);
  });
});
