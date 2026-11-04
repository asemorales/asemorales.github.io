import { describe, expect, it } from "vitest";
import { GENERATIONS, grow, reached } from "../../src/lib/lsystem.js";

const sequence = (...rolls) => {
  let i = 0;
  return () => rolls[i++ % rolls.length];
};

describe("the 90% gate", () => {
  it("opens only once the viewport's bottom reaches 90% of the page", () => {
    expect(reached(0, 1000, 10000)).toBe(false);
    expect(reached(7999, 1000, 10000)).toBe(false);
    expect(reached(8000, 1000, 10000)).toBe(true);
    expect(reached(9000, 1000, 10000)).toBe(true);
  });

  it("is open from the start on a page that fits on screen", () => {
    expect(reached(0, 900, 900)).toBe(true);
  });
});

describe("grow", () => {
  const stem = [{ symbol: "A", x: 100, y: 200, heading: 0 }];
  const branch = [{ symbol: "B", x: 100, y: 200, heading: 0 }];

  it("extends an apex by one segment", () => {
    const { apices, path } = grow(stem, sequence(0.9));
    expect(path).toBe("M100 200L100 188");
    expect(apices).toEqual([{ symbol: "A", x: 100, y: 188, heading: 0 }]);
  });

  it("forks a stem into a branch and a stem turned opposite ways", () => {
    const { apices } = grow(stem, sequence(0.1, 0.5, 0.5));
    expect(apices).toEqual([
      { symbol: "B", x: 100, y: 188, heading: 25 },
      { symbol: "A", x: 100, y: 188, heading: -25 },
    ]);
  });

  it("forks the other way", () => {
    const { apices } = grow(stem, sequence(0.5, 0.5, 0.5));
    expect(apices.map((a) => a.heading)).toEqual([-25, 25]);
  });

  it("ends a branch that takes the terminal rule", () => {
    const { apices, path } = grow(branch, sequence(0.95));
    expect(apices).toEqual([]);
    expect(path).toBe("M100 200L100 188");
  });

  it("never ends a stem", () => {
    for (const roll of [0, 0.3, 0.6, 0.99]) expect(grow(stem, sequence(roll)).apices.some((a) => a.symbol === "A")).toBe(true);
  });

  it("straightens a leaning apex toward vertical", () => {
    const { apices } = grow([{ ...stem[0], heading: 40 }], sequence(0.9));
    expect(apices[0].heading).toBe(34);
  });

  it("keeps a plant inside the 224px band", () => {
    let apices = [{ ...stem[0], y: 224 }];
    for (let i = 0; i < GENERATIONS; i++) apices = grow(apices, sequence(0.9)).apices;
    expect(apices[0].y).toBeGreaterThanOrEqual(0);
  });
});
