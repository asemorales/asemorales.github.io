import { describe, expect, it } from "vitest";
import { DANDELION, KINDS, TREE, canopy, establish, sprout } from "../../src/lib/lsystem.js";
import { ORDER, census, coherence, drift, findShade, glow, recent, seek, swarm, synchronize, weave } from "../../src/lib/wildlife.js";

const seeded = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

describe("recent", () => {
  it("counts the notes tended in the last 30 days", () => {
    const now = Date.parse("2026-11-07");
    const dates = ["2026-11-07", "2026-10-09", "2026-10-08", "2025-01-01"].map(Date.parse);
    expect(recent(dates, now)).toBe(2);
  });

  it("counts a date ahead of the reader's clock", () => {
    expect(recent([Date.parse("2026-11-08")], Date.parse("2026-11-07"))).toBe(1);
  });
});

describe("census", () => {
  it("brings no one to a garden left alone", () => {
    expect(Object.values(census(0, 12)).every((count) => count === 0)).toBe(true);
  });

  it("brings one visitor per note, in order", () => {
    const visitors = census(ORDER.length, 99);
    for (const kind of new Set(ORDER)) expect(visitors[kind]).toBe(ORDER.filter((other) => other === kind).length);
  });

  it("brings fireflies past the order, up to the cap", () => {
    expect(census(ORDER.length + 3, 99).firefly).toBe(ORDER.filter((kind) => kind === "firefly").length + 3);
    expect(census(40, 6).firefly).toBe(6);
  });
});

describe("fireflies", () => {
  it("flash once per turn of phase", () => {
    expect(glow(0)).toBe(1);
    expect(glow(2 * Math.PI)).toBeCloseTo(1);
    expect(glow(Math.PI)).toBeLessThan(0.01);
  });

  it("fall into step over a few minutes", () => {
    const random = seeded(7);
    const flies = Array.from({ length: 10 }, () => swarm(random));
    const before = coherence(flies).order;
    for (let frame = 0; frame < 180 * 30; frame++) synchronize(flies, 1 / 30);
    expect(before).toBeLessThan(0.6);
    expect(coherence(flies).order).toBeGreaterThan(0.95);
  });

  it("stay out of step without coupling", () => {
    const random = seeded(7);
    const flies = Array.from({ length: 10 }, () => swarm(random));
    for (let frame = 0; frame < 180 * 30; frame++) synchronize(flies, 1 / 30, 0);
    expect(coherence(flies).order).toBeLessThan(0.6);
  });
});

describe("seek", () => {
  it("arrives without overshooting", () => {
    const agent = { x: 0, y: 0, vx: 0, vy: 0 };
    let gap = Infinity;
    for (let frame = 0; frame < 600; frame++) gap = seek(agent, 50, -20, 30, 1 / 60);
    expect(gap).toBeLessThan(1);
    expect(agent.x).toBeLessThanOrEqual(50.5);
  });
});

describe("drift", () => {
  const mote = () => ({ x: 0, y: 0, vx: 0, vy: 0, fall: 20, catch: 1, sway: 0, age: 0, seed: 0 });

  it("falls and rides the wind", () => {
    const calm = mote();
    const windy = mote();
    for (let frame = 0; frame < 120; frame++) {
      drift(calm, 0, 1 / 60);
      drift(windy, 30, 1 / 60);
    }
    expect(calm.y).toBeGreaterThan(10);
    expect(calm.x).toBeCloseTo(0);
    expect(windy.x).toBeGreaterThan(15);
  });
});

describe("findShade", () => {
  const width = 400;
  const ground = 224;

  it("finds no shade on open ground", () => {
    expect(findShade(canopy(width, ground), width, [], seeded(3))).toBeNull();
  });

  it("finds shade under a tree, away from what is taken", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const garden = canopy(width, ground);
      if (!establish(garden, [TREE], 200, ground, width, seeded(seed))) continue;
      const x = findShade(garden, width, [200], seeded(seed));
      expect(x).not.toBeNull();
      expect(Math.abs(x - 200)).toBeGreaterThanOrEqual(8);
      return;
    }
    throw new Error("no tree grew");
  });
});

describe("weave", () => {
  it("spins a web between two branches of a fork", () => {
    const web = weave({ x: 100, y: 100, headings: [-0.5, 0.5] }, 10);
    expect(web.strands.length).toBe(10);
    for (const { end } of web.strands) expect(Math.hypot(end.x - 100, end.y - 100)).toBeLessThanOrEqual(10.1);
    expect(web.hub.y).toBeLessThan(100);
  });

  it("refuses forks too narrow, too wide, or too near the top", () => {
    expect(weave({ x: 100, y: 100, headings: [0, 0.2] }, 10)).toBeNull();
    expect(weave({ x: 100, y: 100, headings: [-1.5, 1.5] }, 10)).toBeNull();
    expect(weave({ x: 100, y: 10, headings: [-0.5, 0.5] }, 10)).toBeNull();
  });
});

describe("landmarks", () => {
  it("marks flowers where wildlife can land", () => {
    const flower = sprout(KINDS[2], 500, 224, 1000, seeded(4));
    expect(flower.blooms.length).toBeGreaterThan(0);
    for (const { y } of flower.blooms) expect(y).toBeLessThan(224);
  });

  it("marks twigs and forks on a tree", () => {
    const tree = sprout(TREE, 500, 224, 1000, seeded(4));
    expect(tree.twigs.length).toBeGreaterThan(1);
    expect(tree.forks.some(({ headings }) => headings.length > 1)).toBe(true);
  });

  it("tops a dandelion with a puff", () => {
    const dandelion = sprout(DANDELION, 500, 224, 1000, seeded(4));
    expect(dandelion.puff.rays.length).toBe(10);
    expect(dandelion.layers.join("")).toContain(dandelion.puff.d);
  });
});
