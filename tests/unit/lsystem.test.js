import { describe, expect, it } from "vitest";
import { GENERATIONS, KINDS, TREE, between, choose, derive, interpret, reached, spots, sprout } from "../../src/lib/lsystem.js";

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

describe("between", () => {
  it("includes both ends", () => {
    expect(between(1, 3, () => 0)).toBe(1);
    expect(between(1, 3, () => 0.5)).toBe(2);
    expect(between(1, 3, () => 0.99)).toBe(3);
  });
});

describe("spots", () => {
  it("places one spot inside each equal slice of the width", () => {
    for (const roll of [0, 0.5, 0.99]) {
      const xs = spots(10, 1000, () => roll);
      expect(xs).toHaveLength(10);
      xs.forEach((x, i) => {
        expect(x).toBeGreaterThanOrEqual(i * 100);
        expect(x).toBeLessThanOrEqual((i + 1) * 100);
      });
    }
  });
});

describe("derive", () => {
  it("rewrites every symbol in parallel", () => {
    expect(derive({ axiom: "X", generations: 2, rules: { X: "F[+X]X", F: "FF" } })).toBe("FF[+F[+X]X]F[+X]X");
  });

  it("picks among weighted rules", () => {
    const rules = {
      A: [
        [0.5, "x"],
        [0.5, "y"],
      ],
    };
    expect(derive({ axiom: "A", generations: 1, rules }, () => 0.1)).toBe("x");
    expect(derive({ axiom: "A", generations: 1, rules }, () => 0.9)).toBe("y");
  });

  it("closes open apices with flowers", () => {
    expect(derive({ axiom: "aI", generations: 0, rules: {}, tips: /a/g })).toBe("KI");
  });

  it("reads left context past a closed branch and up into a branch's parent", () => {
    expect(derive({ axiom: "0[F1]1", generations: 1, rules: { "011": "y" } })).toBe("0[Fy]y");
  });

  it("reads right context into the next branch and treats a branch's end as 1", () => {
    expect(derive({ axiom: "1[0]", generations: 1, rules: { 110: "x", 101: "y" } })).toBe("x[y]");
  });

  it("flips turns when the rules say so", () => {
    expect(derive({ axiom: "+-", generations: 1, rules: { "+": "-", "-": "+" } })).toBe("-+");
  });
});

describe("interpret", () => {
  const system = { turn: [90, 90], jitter: 0 };

  it("draws upward and returns to the branch point", () => {
    const { lines } = interpret("F[+F]F", system, () => 0.5);
    expect(lines.map((line) => [Math.round(line.x2), Math.round(line.y2), line.reach])).toEqual([
      [0, -1, 1],
      [1, -1, 2],
      [0, -2, 2],
    ]);
  });

  it("alternates lateral branches between sides", () => {
    const { lines } = interpret("[~F][~F]", system, () => 0.5);
    expect(Math.round(lines[0].x2)).toBe(-Math.round(lines[1].x2));
  });

  it("leans a heading back toward vertical", () => {
    const { lines } = interpret("+FF", { ...system, straighten: 0.5 }, () => 0.5);
    expect(lines[1].x2 - lines[0].x2).toBeLessThan(lines[0].x2);
  });

  it("marks bracts and flowers where the turtle stands", () => {
    const { bracts, flowers } = interpret("FLK", system, () => 0.5);
    expect(bracts[0].reach).toBe(1);
    expect(flowers[0].reach).toBe(1);
  });
});

describe("choose", () => {
  const others = KINDS.filter((kind) => kind !== TREE);

  it("picks by weight", () => {
    expect(choose(KINDS, () => 0)).toBe(TREE);
    expect(choose(KINDS, () => 0.99)).toBe(KINDS.at(-1));
  });

  it("shares the whole range among the kinds it is given", () => {
    expect(choose(others, () => 0.49)).toBe(others[0]);
    expect(choose(others, () => 0.51)).toBe(others[1]);
  });
});

describe("sprout", () => {
  const ground = 224;
  const seeded = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stature = (layers) => {
    const tops = [...layers.join("").matchAll(/[ML][\d.-]+ ([\d.-]+)/g)].map((match) => +match[1]);
    return ground - Math.min(...tops);
  };
  const plantOf = (kind, seed) => sprout(KINDS[kind], 500, ground, 1000, seeded(seed));
  const sides = (layers) => {
    const xs = [...layers.join("").matchAll(/[ML]([\d.-]+) [\d.-]+/g)].map((match) => +match[1]);
    return [Math.min(...xs), Math.max(...xs)];
  };

  it("keeps every tree taller than every fern and flower", () => {
    expect(KINDS[0].height[0]).toBeGreaterThan(Math.max(KINDS[1].height[1], KINDS[2].height[1]));
  });

  it("gives each plant a height inside its kind's range", () => {
    KINDS.forEach(({ height: [low, high] }, kind) => {
      const heights = Array.from({ length: 40 }, (_, seed) => stature(plantOf(kind, seed + 1)));
      for (const height of heights) {
        expect(height).toBeGreaterThanOrEqual(low - 0.2);
        expect(height).toBeLessThanOrEqual(high + 0.2);
      }
      expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan((high - low) / 2);
    });
  });

  it("fits inside the 224px band", () => {
    expect(Math.max(...KINDS.map(({ height }) => height[1]))).toBeLessThanOrEqual(ground);
  });

  it("grows outward from the base over every generation", () => {
    KINDS.forEach((_, kind) => {
      const layers = plantOf(kind, 7);
      expect(layers).toHaveLength(GENERATIONS);
      expect(layers[0]).toContain(`M500 ${ground}`);
    });
  });

  it("moves a plant inward instead of letting it cross either side", () => {
    KINDS.forEach((kind) => {
      for (const x of [0, 320]) {
        for (let seed = 1; seed <= 40; seed++) {
          const [left, right] = sides(sprout(kind, x, ground, 320, seeded(seed)));
          expect(left).toBeGreaterThanOrEqual(0);
          expect(right).toBeLessThanOrEqual(320);
        }
      }
    });
  });

  it("shrinks a plant wider than the page to fit", () => {
    const [left, right] = sides(sprout(TREE, 40, ground, 80, seeded(3)));
    expect(left).toBeGreaterThanOrEqual(0);
    expect(right).toBeLessThanOrEqual(80);
    expect(right - left).toBeGreaterThan(60);
  });

  it("leaves a plant at its spot when it already fits", () => {
    const layers = sprout(KINDS[1], 500, ground, 1000, seeded(5));
    expect(layers[0]).toContain(`M500 ${ground}`);
  });

  it("stays small enough to redraw every frame", () => {
    KINDS.forEach((_, kind) => {
      for (let seed = 1; seed <= 40; seed++) expect(plantOf(kind, seed).join("").split("M").length).toBeLessThan(3000);
    });
  });
});
