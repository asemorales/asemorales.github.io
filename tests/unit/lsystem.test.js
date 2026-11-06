import { describe, expect, it } from "vitest";
import {
  GENERATIONS,
  KINDS,
  TREE,
  between,
  brush,
  canopy,
  swing,
  plantNear,
  choose,
  derive,
  establish,
  interpret,
  lightOn,
  reached,
  remove,
  skylight,
  spots,
  sprout,
} from "../../src/lib/lsystem.js";

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

  it("bends growth toward the side it is given", () => {
    const right = interpret("FFFF", { ...system, bend: 10 }, () => 0.5).lines.at(-1).x2;
    const left = interpret("FFFF", { ...system, bend: -10 }, () => 0.5).lines.at(-1).x2;
    expect(right).toBeGreaterThan(0.5);
    expect(left).toBeCloseTo(-right);
  });

  it("marks bracts and flowers where the turtle stands", () => {
    const { bracts, flowers } = interpret("FLK", system, () => 0.5);
    expect(bracts[0].reach).toBe(1);
    expect(flowers[0].reach).toBe(1);
  });
});

describe("choose", () => {
  const others = KINDS.slice(1, 3);

  it("picks by weight", () => {
    expect(choose(KINDS, () => 0)).toBe(TREE);
    expect(choose(KINDS, () => 0.99)).toBe(KINDS.at(-1));
  });

  it("shares the whole range among the kinds it is given", () => {
    expect(choose(others, () => 0.49)).toBe(others[0]);
    expect(choose(others, () => 0.51)).toBe(others[1]);
  });
});

const seeded = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

describe("the light model", () => {
  const ground = 224;
  const width = 1000;
  const [, FERN, FLOWER] = KINDS;
  const tallest = (random) => {
    const garden = canopy(width, ground);
    return { garden, tree: establish(garden, [TREE], 500, ground, width, random) };
  };
  const reach = ({ foliage }) => {
    const cols = foliage.map(({ col }) => col);
    return (Math.min(...cols) + Math.max(...cols)) / 2;
  };
  const crown = ({ foliage }) => Math.min(...foliage.map(({ row }) => row));

  it("gives open ground full light", () => {
    expect(skylight(canopy(width, ground), 10, 20)).toBe(1);
  });

  it("dims light under foliage, and beside it through the slanted rays", () => {
    const { garden, tree } = tallest(seeded(11));
    const col = Math.round(reach(tree));
    const under = skylight(garden, col, garden.rows - 1);
    expect(under).toBeLessThan(1);
    expect(under).toBeLessThan(skylight(garden, col + 60, garden.rows - 1));
  });

  it("restores the light when a plant is removed", () => {
    const { garden, tree } = tallest(seeded(11));
    remove(garden, tree);
    expect(garden.plants).toHaveLength(0);
    expect(skylight(garden, Math.round(reach(tree)), garden.rows - 1)).toBeCloseTo(1);
  });

  it("does not count a plant's own foliage as its shade", () => {
    const { garden, tree } = tallest(seeded(11));
    expect(lightOn(garden, tree)).toBe(1);
  });

  it("never leaves a plant below the light it needs", () => {
    for (let seed = 1; seed <= 15; seed++) {
      const random = seeded(seed * 101);
      const garden = canopy(width, ground);
      for (const x of spots(40, width, random)) {
        establish(garden, KINDS, x, ground, width, random);
        for (const plant of garden.plants) expect(lightOn(garden, plant)).toBeGreaterThanOrEqual(plant.kind.needs);
      }
    }
  });

  it("refuses a spot too dark for every kind, and leaves the garden unchanged", () => {
    const garden = canopy(width, ground);
    garden.density.fill(50);
    const before = [...garden.density];
    expect(establish(garden, KINDS, 500, ground, width, seeded(3))).toBeNull();
    expect(garden.plants).toHaveLength(0);
    expect([...garden.density]).toEqual(before);
  });

  it("keeps stems apart by the room each kind needs", () => {
    for (const fieldWidth of [393, 1440]) {
      for (let seed = 1; seed <= 15; seed++) {
        const random = seeded(seed * 307);
        const garden = canopy(fieldWidth, ground);
        for (const x of spots(40, fieldWidth, random)) establish(garden, KINDS, x, ground, fieldWidth, random);
        for (const a of garden.plants) {
          for (const b of garden.plants) {
            if (a !== b) expect(Math.abs(a.base - b.base)).toBeGreaterThanOrEqual(a.kind.room + b.kind.room);
          }
        }
      }
    }
  });

  it("refuses a plant that would starve its neighbor", () => {
    const refused = Array.from({ length: 30 }, (_, seed) => {
      const random = seeded((seed + 1) * 211);
      const garden = canopy(width, ground);
      const fern = establish(garden, [FERN], 500, ground, width, random);
      Object.assign(fern, { kind: { ...fern.kind, needs: 0.99 } });
      return establish(garden, [TREE], 500, ground, width, random) === null && garden.plants.length === 1;
    });
    expect(refused.every(Boolean)).toBe(true);
  });

  it("keeps plants shorter in shade than in the open", () => {
    const open = [];
    const shaded = [];
    for (let seed = 1; seed <= 40; seed++) {
      const garden = canopy(width, ground);
      open.push(crown(establish(garden, [FLOWER], 500, ground, width, seeded(seed))));
      garden.density.fill(0.4);
      shaded.push(crown(sprout(FLOWER, 500, ground, width, seeded(seed), { light: skylight(garden, 62, 20) })));
    }
    const mean = (rows) => rows.reduce((sum, row) => sum + row, 0) / rows.length;
    expect(mean(shaded)).toBeGreaterThan(mean(open));
  });

  it("leans a plant toward the brighter side", () => {
    const lean = (amount) => {
      const centers = Array.from({ length: 30 }, (_, seed) => reach(sprout(FERN, 500, ground, width, seeded(seed + 1), { lean: amount })));
      return centers.reduce((sum, center) => sum + center, 0) / centers.length;
    };
    expect(lean(30)).toBeGreaterThan(lean(-30));
  });

  it("favors shade-tolerant kinds as light falls", () => {
    const share = (light) => {
      const random = seeded(17);
      const picks = Array.from({ length: 2000 }, () => choose(KINDS, random, light));
      return picks.filter((kind) => kind === FERN).length / picks.length;
    };
    expect(share(0.3)).toBeGreaterThan(share(1) + 0.1);
  });
});

describe("sprout", () => {
  const ground = 224;
  const stature = (layers) => {
    const tops = [...layers.join("").matchAll(/[ML][\d.-]+ ([\d.-]+)/g)].map((match) => +match[1]);
    return ground - Math.min(...tops);
  };
  const plantOf = (kind, seed) => sprout(KINDS[kind], 500, ground, 1000, seeded(seed)).layers;
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
          const [left, right] = sides(sprout(kind, x, ground, 320, seeded(seed)).layers);
          expect(left).toBeGreaterThanOrEqual(0);
          expect(right).toBeLessThanOrEqual(320);
        }
      }
    });
  });

  it("shrinks a plant wider than the page to fit", () => {
    const [left, right] = sides(sprout(TREE, 40, ground, 80, seeded(3)).layers);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(right).toBeLessThanOrEqual(80);
    expect(right - left).toBeGreaterThan(60);
  });

  it("leaves a plant at its spot when it already fits", () => {
    const { layers } = sprout(KINDS[1], 500, ground, 1000, seeded(5));
    expect(layers[0]).toContain(`M500 ${ground}`);
  });

  it("stays small enough to redraw every frame", () => {
    KINDS.forEach((_, kind) => {
      for (let seed = 1; seed <= 40; seed++) expect(plantOf(kind, seed).join("").split("M").length).toBeLessThan(3000);
    });
  });
});

describe("plantNear", () => {
  it("finds the plant whose foliage is under the pointer", () => {
    const garden = canopy(1000, 224);
    const tree = establish(garden, [TREE], 500, 224, 1000, seeded(1));
    const [{ col, row }] = tree.foliage;
    expect(plantNear(garden, col * 8 + 4, row * 8 + 4)).toBe(tree);
  });

  it("finds nothing over bare ground", () => {
    const garden = canopy(1000, 224);
    establish(garden, [TREE], 900, 224, 1000, seeded(1));
    expect(plantNear(garden, 4, 4)).toBeNull();
  });
});

describe("rustle", () => {
  const frame = 1 / 60;

  it("leans the way the pointer moves", () => {
    for (const [pixels, sign] of [
      [20, 1],
      [-20, -1],
    ]) {
      const plant = { tilt: 0, speed: 0 };
      brush(plant, pixels);
      swing(plant, frame);
      expect(Math.sign(plant.tilt)).toBe(sign);
    }
  });

  it("eases to rest without another push", () => {
    const plant = { tilt: 0, speed: 0 };
    brush(plant, 30);
    let frames = 0;
    while (swing(plant, frame)) frames++;
    expect(frames).toBeGreaterThan(30);
    expect(frames).toBeLessThan(300);
    expect(plant.tilt).toBe(0);
  });

  it("stays subtle however hard the pointer moves", () => {
    const plant = { tilt: 0, speed: 0 };
    for (let i = 0; i < 300; i++) {
      brush(plant, 500);
      swing(plant, frame);
      expect(Math.abs(plant.tilt)).toBeLessThanOrEqual(0.8);
    }
  });
});
