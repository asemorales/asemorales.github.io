import { CELL, DANDELION, TREE, between, brush, skylight, swing } from "./lsystem.js";

const TAU = 2 * Math.PI;
const DAY = 86_400_000;
const NS = "http://www.w3.org/2000/svg";

const FLASH = 0.4;
const PERIOD = 2.1;
const SPREAD = 0.03;
const COUPLING = 0.2;
const SCARE = 45;
const SHADE = 0.8;
const TRAIL = 40_000;
const GUST_SPEED = 260;

const STAR = "M-2.5 0h5M-1.25-2.17l2.5 4.33M-1.25 2.17l2.5-4.33";
const SNAIL_BODY = "M-5 0H5Q7 0 7-1.5L8-4.5M6.2-1.2L6.6-4";
const SNAIL_SHELL = "M2.4-3.6a3.4 3.4 0 1 1-6.8 0a3.4 3.4 0 1 1 6.8 0M0.6-3.6a1.6 1.6 0 1 1-1.6-1.6";
const PERCHED =
  "M-4-3.4a4 2.4 0 1 0 8 0a4 2.4 0 1 0-8 0ZM2-6a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0ZM5.4-6.4l1.8.5-1.8.4ZM-3.6-3.6l-3.4 1.6.4-.9ZM-.6-1v1M1-1v1";
const WINGS_UP = "M-5-1Q-2.5-3.5 0 0Q2.5-3.5 5-1";
const WINGS_DOWN = "M-5 1.5Q-2.5 .5 0 0Q2.5 .5 5 1.5";
const BUTTERFLY = "M0 0C-2-4-6-4-5-1C-4.5.5-2 .5 0 0C-2 1-4 4-2 4C-1 4 0 2 0 0ZM0 0C2-4 6-4 5-1C4.5.5 2 .5 0 0C2 1 4 4 2 4C1 4 0 2 0 0Z";
const COCOON = "M0 0v1.6M-1.4 4.4a1.4 2.8 0 1 0 2.8 0a1.4 2.8 0 1 0-2.8 0Z";
const MUSHROOM = "M-.9 0L-.6-4H.6L.9 0ZM-4.2-3.8A4.2 3.4 0 0 1 4.2-3.8Z";
const SPIDER = "M-1.2 0a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0-2.4 0ZM-2.6-1.6L0 0 2.6-1.6M-2.6 1.6L0 0 2.6 1.6";
const DOT = "M0 0h.01";
const PETAL = "M-1.2 0a1.2 .7 0 1 0 2.4 0a1.2 .7 0 1 0-2.4 0Z";
const FLUFF = "M0 0v-3M-1.2-4.2L0-3l1.2-1.2M0-3v-1.6";

const MOTES = {
  petal: { d: PETAL, fall: 16, catch: 0.8, sway: 10, life: 25, sow: 0 },
  seed: { d: DOT, fall: 28, catch: 0.5, sway: 4, life: 25, sow: 0.35, width: 1.4 },
  fluff: { d: FLUFF, fall: 5, catch: 1.5, sway: 6, life: 40, sow: 0.3, kinds: [DANDELION] },
};

export const ORDER = [
  "firefly",
  "firefly",
  "snail",
  "firefly",
  "mushroom",
  "spider",
  "firefly",
  "bird",
  "caterpillar",
  "firefly",
  "mushroom",
  "bird",
  "firefly",
  "mushroom",
  "caterpillar",
];

export function recent(dates, now, days = 30) {
  return dates.filter((date) => now - date < days * DAY).length;
}

export function census(count, fireflies) {
  const visitors = { firefly: 0, snail: 0, mushroom: 0, spider: 0, bird: 0, caterpillar: 0 };
  for (let i = 0; i < count; i++) visitors[ORDER[i] ?? "firefly"]++;
  visitors.firefly = Math.min(visitors.firefly, fireflies);
  return visitors;
}

export function swarm(rate = Math.random) {
  return { phase: rate() * TAU, rate: (TAU / PERIOD) * (1 + (rate() - 0.5) * 2 * SPREAD) };
}

export function coherence(flies) {
  let re = 0;
  let im = 0;
  for (const { phase } of flies) {
    re += Math.cos(phase);
    im += Math.sin(phase);
  }
  return { order: flies.length ? Math.hypot(re, im) / flies.length : 0, mean: Math.atan2(im, re) };
}

export function synchronize(flies, seconds, coupling = COUPLING) {
  const { order, mean } = coherence(flies);
  for (const fly of flies) fly.phase = (fly.phase + (fly.rate + coupling * order * Math.sin(mean - fly.phase)) * seconds) % TAU;
}

export function glow(phase) {
  const turn = ((phase % TAU) + TAU) % TAU;
  return Math.exp(-((Math.min(turn, TAU - turn) / FLASH) ** 2));
}

export function seek(agent, x, y, speed, seconds) {
  const dx = x - agent.x;
  const dy = y - agent.y;
  const gap = Math.hypot(dx, dy);
  const pull = Math.min(1, seconds * 3);
  const want = gap ? Math.min(speed, gap * 2) / gap : 0;
  agent.vx += (dx * want - agent.vx) * pull;
  agent.vy += (dy * want - agent.vy) * pull;
  agent.x += agent.vx * seconds;
  agent.y += agent.vy * seconds;
  return Math.hypot(x - agent.x, y - agent.y);
}

export function drift(mote, wind, seconds) {
  mote.vx += (wind - mote.vx) * Math.min(1, mote.catch * seconds);
  mote.vy += (mote.fall - mote.vy) * Math.min(1, 2 * seconds);
  mote.age += seconds;
  mote.x += (mote.vx + Math.sin(mote.age * 3 + mote.seed) * mote.sway) * seconds;
  mote.y += mote.vy * seconds;
}

export function findShade(garden, width, taken, random = Math.random) {
  for (let tries = 0; tries < 24; tries++) {
    const x = 6 + random() * (width - 12);
    if (taken.some((other) => Math.abs(other - x) < 8)) continue;
    if (skylight(garden, Math.floor(x / CELL), garden.rows - 1) < SHADE) return x;
  }
  return null;
}

const round = (value) => +value.toFixed(1);

export function weave({ x, y, headings }, radius) {
  const sorted = [...headings].sort((a, b) => a - b);
  let pair = null;
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > 0.45 && gap < 1.9) pair = [sorted[i - 1], sorted[i]];
  }
  if (!pair || y - radius < 4) return null;
  const [from, to] = pair;
  const at = (angle, r) => ({ x: round(x + r * Math.sin(angle)), y: round(y - r * Math.cos(angle)) });
  const angles = Array.from({ length: 7 }, (_, i) => from + ((to - from) * i) / 6);
  const strand = (points) => ({ d: points.map(({ x, y }, i) => `${i ? "L" : "M"}${x} ${y}`).join(""), end: points.at(-1) });
  return {
    strands: [
      strand([at(from, radius), at(to, radius)]),
      ...angles.slice(1, -1).map((angle) => strand([at(angle, 0), at(angle, radius)])),
      ...[0.85, 0.68, 0.51, 0.34].map((share) => strand(angles.map((angle) => at(angle, radius * share)))),
    ],
    hub: at((from + to) / 2, radius * 0.25),
  };
}

export function inhabit(layer, { width, height, visitors, garden, standing, sow, touch }) {
  const ground = height;
  const pointer = { x: 0, y: 0, here: false, moved: 0 };
  let clock = 0;
  let wind = 0;
  let gust = null;
  let nextGust = between(25_000, 60_000);
  let nextShroom = between(3000, 10_000);

  const shape = (d, attrs = {}, parent = layer) => {
    const el = document.createElementNS(NS, "path");
    el.setAttribute("d", d);
    for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
    parent.append(el);
    return el;
  };
  const group = () => layer.appendChild(document.createElementNS(NS, "g"));
  const put = (el, x, y, extra = "") => el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})${extra}`);
  const near = (x, y, reach) => pointer.here && Math.hypot(pointer.x - x, pointer.y - y) < reach;
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const alive = (plant) => standing().includes(plant);
  const blooms = () => standing().flatMap((plant) => plant.blooms.map((bloom) => ({ plant, ...bloom })));
  const air = () => ({ x: 10 + Math.random() * (width - 20), y: ground * (0.25 + Math.random() * 0.55) });
  const exit = () => ({ x: Math.random() < 0.5 ? -15 : width + 15, y: -15 + Math.random() * 30 });
  const clamp = (agent) => {
    agent.x = Math.max(3, Math.min(width - 3, agent.x));
    agent.y = Math.max(3, Math.min(ground - 3, agent.y));
  };
  const flee = (agent) => {
    const dx = agent.x - pointer.x;
    const dy = agent.y - pointer.y;
    const gap = Math.hypot(dx, dy) || 1;
    agent.vx += (dx / gap) * 80;
    agent.vy += (dy / gap) * 80;
  };

  let flies = [];
  let snails = [];
  let birds = [];
  let spiders = [];
  let larvae = [];
  let shrooms = [];
  let motes = [];

  function populate() {
    layer.replaceChildren();
    flies = Array.from({ length: visitors.firefly }, () => ({
      ...air(),
      ...swarm(),
      vx: 0,
      vy: 0,
      seed: Math.random() * TAU,
      perch: null,
      target: null,
      scared: false,
      until: 0,
      el: shape(STAR, { fill: "none", class: "stroke-glow" }),
    }));
    snails = Array.from({ length: visitors.snail }, () => {
      const g = group();
      return {
        x: 10 + Math.random() * (width - 20),
        dir: Math.random() < 0.5 ? 1 : -1,
        hidden: 0,
        mark: 0,
        trail: [],
        g,
        body: shape(SNAIL_BODY, { fill: "none" }, g),
        shell: shape(SNAIL_SHELL, { fill: "none" }, g),
      };
    });
    for (const snail of snails) snail.mark = snail.x;
    birds = Array.from({ length: visitors.bird }, () => ({
      state: "away",
      until: clock + between(5000, 30_000),
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      face: 1,
      el: shape("", { visibility: "hidden" }),
    }));
    spiders = Array.from({ length: visitors.spider }, () => ({ state: "away", until: clock + between(2000, 8000) }));
    larvae = Array.from({ length: visitors.caterpillar }, () => ({ state: "away", until: clock + between(10_000, 30_000) }));
    shrooms = [];
    motes = [];
  }

  function aim(fly) {
    const spots = blooms();
    fly.target = spots.length && Math.random() < 0.8 ? pick(spots) : air();
  }

  function moveFly(fly, seconds) {
    const scared = near(fly.x, fly.y, SCARE);
    if (scared && !fly.scared) {
      fly.perch = null;
      fly.target = air();
      fly.phase += (Math.random() - 0.5) * 2;
      flee(fly);
    }
    fly.scared = scared;
    if (fly.perch) {
      if (clock < fly.until && alive(fly.perch.plant)) return;
      fly.perch = null;
      aim(fly);
    }
    if (!fly.target || (fly.target.plant && !alive(fly.target.plant))) aim(fly);
    const { x, y, plant } = fly.target;
    const wobble = plant ? 0 : 1;
    const gap = seek(
      fly,
      x + wobble * 5 * Math.sin(clock / 900 + fly.seed),
      y + wobble * 4 * Math.cos(clock / 1100 + fly.seed),
      scared ? 60 : 22,
      seconds,
    );
    fly.x += wind * 0.3 * seconds;
    clamp(fly);
    if (gap > 1.5) return;
    if (plant) {
      fly.perch = fly.target;
      fly.until = clock + between(3000, 12_000);
      fly.vx = fly.vy = 0;
    } else aim(fly);
  }

  function drawFly(fly) {
    const { x, y } = fly.perch ?? fly;
    put(fly.el, x, fly.perch ? y - 1.5 : y);
    fly.el.setAttribute("opacity", (0.15 + 0.85 * glow(fly.phase)).toFixed(2));
  }

  function moveSnail(snail, seconds) {
    if (near(snail.x, ground - 4, 22)) snail.hidden = clock + 2500;
    if (clock >= snail.hidden) {
      snail.x += snail.dir * 2.5 * seconds;
      if (snail.x < 8 || snail.x > width - 8 || Math.random() < seconds / 90) snail.dir *= -1;
      snail.x = Math.max(8, Math.min(width - 8, snail.x));
    }
    if (Math.abs(snail.x - snail.mark) >= 3) {
      snail.trail.push({ born: clock, el: shape(`M${snail.mark.toFixed(1)} ${ground - 0.5}H${snail.x.toFixed(1)}`, { "stroke-width": 0.6 }) });
      snail.mark = snail.x;
    }
    snail.trail = snail.trail.filter(({ born, el }) => {
      const fade = 0.7 * (1 - (clock - born) / TRAIL);
      if (fade <= 0) el.remove();
      else el.setAttribute("opacity", fade.toFixed(2));
      return fade > 0;
    });
  }

  function drawSnail(snail) {
    put(snail.g, snail.x, ground, snail.dir < 0 ? " scale(-1 1)" : "");
    snail.body.setAttribute("visibility", clock < snail.hidden ? "hidden" : "visible");
  }

  function perchOn(tree) {
    const top = Math.min(...tree.twigs.map((twig) => twig.y));
    const high = tree.twigs.filter((twig) => twig.y > 8 && twig.y < top + 0.6 * (ground - top));
    return high.length ? { plant: tree, ...pick(high) } : null;
  }

  function leave(bird) {
    bird.state = "leaving";
    bird.target = exit();
  }

  function moveBird(bird, seconds) {
    if (bird.state === "away") {
      if (clock < bird.until) return;
      const tree = pick(standing().filter((plant) => plant.kind === TREE));
      bird.perch = tree && perchOn(tree);
      if (!bird.perch) {
        bird.until = clock + 10_000;
        return;
      }
      Object.assign(bird, exit(), { state: "arriving", speed: 70, vx: 0, vy: 0 });
      bird.el.setAttribute("visibility", "visible");
      return;
    }
    const scared = near(bird.x, bird.y, 50) || (bird.perch && !alive(bird.perch.plant));
    if (scared && bird.state !== "leaving") leave(bird);
    if (bird.state === "perched") {
      if (clock > bird.until) leave(bird);
      else if (clock > bird.hop) {
        const nearby = bird.perch.plant.twigs.filter(
          (twig) => twig !== bird.perch && Math.hypot(twig.x - bird.x, twig.y - bird.y) < 20 && twig.y > 8,
        );
        if (nearby.length) Object.assign(bird, { state: "arriving", speed: 30, perch: { plant: bird.perch.plant, ...pick(nearby) } });
        bird.hop = clock + between(2000, 5000);
      }
      return;
    }
    const target = bird.state === "arriving" ? bird.perch : bird.target;
    const gap = seek(bird, target.x, target.y, bird.state === "leaving" ? 90 : bird.speed, seconds);
    if (Math.abs(bird.vx) > 2) bird.face = Math.sign(bird.vx);
    if (gap > (bird.state === "leaving" ? 4 : 1)) return;
    if (bird.state === "leaving") {
      bird.state = "away";
      bird.until = clock + between(15_000, 60_000);
      bird.el.setAttribute("visibility", "hidden");
      return;
    }
    if (bird.speed > 50) {
      touch(bird.perch.plant, 3 * bird.face);
      bird.until = clock + between(10_000, 30_000);
    }
    Object.assign(bird, { state: "perched", x: bird.perch.x, y: bird.perch.y, vx: 0, vy: 0, hop: clock + between(2000, 5000) });
  }

  function drawBird(bird) {
    if (bird.state === "away") return;
    const perched = bird.state === "perched";
    bird.el.setAttribute("d", perched ? PERCHED : Math.floor(clock / 120) % 2 ? WINGS_UP : WINGS_DOWN);
    if (perched) bird.el.removeAttribute("fill");
    else bird.el.setAttribute("fill", "none");
    put(bird.el, bird.x, bird.y, bird.face < 0 ? " scale(-1 1)" : "");
  }

  function spin(spider) {
    for (let tries = 0; tries < 6; tries++) {
      const tree = pick(standing().filter((plant) => plant.kind === TREE));
      if (!tree?.forks.length) return false;
      const fork = pick(tree.forks);
      const web = weave(fork, between(9, 14));
      if (!web) continue;
      const g = group();
      Object.assign(spider, { state: "building", host: tree, fork, web, built: 0, next: clock, g, tilt: 0, speed: 0 });
      spider.el = shape(SPIDER, {}, g);
      return true;
    }
    return false;
  }

  function moveSpider(spider, seconds) {
    if (spider.state === "away") {
      if (clock >= spider.until && !spin(spider)) spider.until = clock + 10_000;
      return;
    }
    if (!alive(spider.host)) {
      spider.g.remove();
      Object.assign(spider, { state: "away", until: clock + 20_000 });
      return;
    }
    while (spider.state === "building" && clock >= spider.next) {
      shape(spider.web.strands[spider.built++].d, { fill: "none", "stroke-width": 0.4 }, spider.g).before(spider.el);
      spider.next += seconds ? 500 : 0;
      if (spider.built === spider.web.strands.length) spider.state = "resting";
    }
    if (near(spider.fork.x, spider.fork.y - 6, 18) && pointer.moved) brush(spider, pointer.moved);
    swing(spider, seconds);
  }

  function drawSpider(spider) {
    if (spider.state === "away") return;
    const { x, y } = spider.state === "resting" ? spider.web.hub : (spider.web.strands[spider.built - 1]?.end ?? spider.fork);
    put(spider.el, x, y);
    spider.g.setAttribute("transform", `rotate(${(spider.tilt * 8).toFixed(2)} ${spider.fork.x} ${spider.fork.y})`);
  }

  function hatch(larva) {
    const hosts = standing().filter((plant) => plant.kind !== TREE && plant.twigs.some((twig) => twig.y < ground - 15));
    const host = pick(hosts);
    if (!host) return false;
    const twig = pick(host.twigs.filter((twig) => twig.y < ground - 15));
    Object.assign(larva, {
      state: "crawl",
      host,
      twig,
      start: clock,
      until: clock + 25_000,
      el: shape("", { fill: "none", "stroke-width": 1.8, "stroke-linecap": "round" }),
    });
    return true;
  }

  function moveLarva(larva, seconds) {
    if (larva.state === "away") {
      if (clock >= larva.until && !hatch(larva)) larva.until = clock + 10_000;
      return;
    }
    if ((larva.state === "crawl" || larva.state === "cocoon") && !alive(larva.host)) {
      larva.el.remove();
      Object.assign(larva, { state: "away", until: clock + between(20_000, 60_000) });
      return;
    }
    if (larva.state === "crawl" && clock >= larva.until) {
      Object.assign(larva, { state: "cocoon", until: clock + 30_000 });
      larva.el.setAttribute("d", COCOON);
      larva.el.setAttribute("stroke-width", 1);
      larva.el.removeAttribute("fill");
    } else if (larva.state === "cocoon" && clock >= larva.until) {
      larva.el.remove();
      Object.assign(larva, { state: "flutter", x: larva.twig.x, y: larva.twig.y + 4, vx: 0, vy: 0, visits: 0, target: null, el: shape(BUTTERFLY) });
    } else if (larva.state === "flutter" || larva.state === "sip" || larva.state === "gone") {
      flutter(larva, seconds);
    }
  }

  function flutter(fly, seconds) {
    if (fly.state !== "gone" && near(fly.x, fly.y, 40)) {
      flee(fly);
      Object.assign(fly, { state: "gone", target: exit() });
    }
    if (fly.state === "sip") {
      if (clock < fly.until && alive(fly.target.plant)) return;
      fly.visits++;
      fly.state = "flutter";
      fly.target = null;
    }
    if (fly.state === "flutter" && (!fly.target || (fly.target.plant && !alive(fly.target.plant)))) {
      const spots = blooms();
      fly.target = fly.visits < 3 && spots.length ? pick(spots) : exit();
      if (!fly.target.plant) fly.state = "gone";
    }
    const gap = seek(
      fly,
      fly.target.x,
      fly.target.y + (fly.state === "gone" ? 0 : 6 * Math.sin(clock / 180)),
      fly.state === "gone" ? 45 : 28,
      seconds,
    );
    fly.x += wind * 0.5 * seconds;
    if (fly.state === "gone") {
      if (gap < 6 || fly.x < -20 || fly.x > width + 20 || fly.y < -20) {
        fly.el.remove();
        Object.assign(fly, { state: "away", until: clock + between(20_000, 60_000) });
      }
    } else if (gap < 2) Object.assign(fly, { state: "sip", until: clock + 1500, vx: 0, vy: 0 });
  }

  function drawLarva(larva) {
    if (larva.state === "away") return;
    if (larva.state === "crawl") {
      const { x, y, heading } = larva.twig;
      const done = (clock - larva.start) / 25_000;
      const back = 7 * (1 - done);
      const arch = 2.2 * Math.abs(Math.sin((clock - larva.start) / 350));
      const length = 6 - arch;
      larva.el.setAttribute("d", `M${(-length).toFixed(1)} 0Q${(-length / 2).toFixed(1)} ${(-arch * 2).toFixed(1)} 0 0`);
      put(larva.el, x - back * Math.sin(heading), y + back * Math.cos(heading), ` rotate(${((heading * 180) / Math.PI - 90).toFixed(1)})`);
    } else if (larva.state === "cocoon") {
      const shiver = (larva.until - clock) % 7000 < 600 ? 8 * Math.sin(clock / 60) : 0;
      put(larva.el, larva.twig.x, larva.twig.y, ` rotate(${shiver.toFixed(1)})`);
    } else {
      const beat = larva.state === "sip" ? clock / 300 : clock / 70;
      put(larva.el, larva.x, larva.y, ` scale(${(0.25 + 0.75 * Math.abs(Math.sin(beat))).toFixed(2)} 1)`);
    }
  }

  function moveShrooms() {
    if (shrooms.length < visitors.mushroom && clock >= nextShroom) {
      const x = findShade(garden, width, [...shrooms.map((shroom) => shroom.x), ...standing().map((plant) => plant.base)]);
      if (x !== null) shrooms.push({ x, born: clock, dies: clock + between(60_000, 150_000), size: 0.8 + Math.random() * 0.5, el: shape(MUSHROOM) });
      nextShroom = clock + between(8000, 25_000);
    }
    shrooms = shrooms.filter((shroom) => {
      if (clock < shroom.dies) return true;
      shroom.el.remove();
      return false;
    });
  }

  function drawShroom(shroom) {
    const grown = Math.max(0, Math.min(1, (clock - shroom.born) / 3000, (shroom.dies - clock) / 2000));
    put(shroom.el, shroom.x, ground, ` scale(${(grown * shroom.size).toFixed(2)})`);
  }

  function mote(kind, x, y, vx = 0, vy = 0) {
    const type = MOTES[kind];
    const attrs = type.width
      ? { "stroke-width": type.width, "stroke-linecap": "round" }
      : kind === "fluff"
        ? { fill: "none", "stroke-width": 0.6 }
        : {};
    motes.push({ ...type, x, y, vx, vy, age: 0, seed: Math.random() * TAU, el: shape(type.d, attrs) });
  }

  function moveMotes(seconds) {
    motes = motes.filter((m) => {
      drift(m, wind, seconds);
      const landed = m.y >= ground;
      const gone = landed || m.age > m.life || m.x < -10 || m.x > width + 10 || m.y < -10;
      if (!gone) return true;
      m.el.remove();
      if (landed && Math.random() < m.sow) sow(m.x, m.kinds);
      return false;
    });
  }

  function drawMote(m) {
    const fade = Math.min(1, (m.life - m.age) / 1.5);
    m.el.setAttribute("opacity", fade.toFixed(2));
    put(m.el, m.x, m.y, m.d === DOT ? "" : ` rotate(${((m.age * 90 + m.seed * 57) % 360).toFixed(0)})`);
  }

  function blow(plant, push = 0) {
    if (!plant.puff || plant.blown || !alive(plant)) return;
    plant.blown = true;
    plant.layers = plant.layers.map((layer) => layer.replace(plant.puff.d, ""));
    plant.path.setAttribute("d", plant.path.getAttribute("d").replace(plant.puff.d, ""));
    for (const { dx, dy } of plant.puff.rays) mote("fluff", plant.puff.x + dx, plant.puff.y + dy, dx * 4 + push, dy * 3 - 10);
  }

  function blowGust(seconds) {
    if (!gust && clock >= nextGust) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      gust = { dir, front: dir > 0 ? -20 : width + 20, strength: 12 + Math.random() * 14 };
      nextGust = clock + between(25_000, 70_000);
    }
    wind += ((gust ? gust.dir * gust.strength * 1.5 : 0) - wind) * Math.min(1, seconds);
    if (!gust) return;
    const before = gust.front;
    gust.front += gust.dir * GUST_SPEED * seconds;
    const crossed = (x) => (x - before) * (x - gust.front) <= 0;
    for (const plant of standing()) {
      if (!crossed(plant.base)) continue;
      touch(plant, gust.dir * gust.strength);
      if (gust.strength > 18) blow(plant, gust.dir * gust.strength);
    }
    for (const spider of spiders) if (spider.fork && crossed(spider.fork.x)) brush(spider, gust.dir * gust.strength);
    if (gust.front < -40 || gust.front > width + 40) gust = null;
  }

  function draw() {
    flies.forEach(drawFly);
    snails.forEach(drawSnail);
    birds.forEach(drawBird);
    spiders.forEach(drawSpider);
    larvae.forEach(drawLarva);
    shrooms.forEach(drawShroom);
    motes.forEach(drawMote);
  }

  populate();

  return {
    step(seconds) {
      clock += seconds * 1000;
      blowGust(seconds);
      synchronize(flies, seconds);
      for (const fly of flies) moveFly(fly, seconds);
      for (const snail of snails) moveSnail(snail, seconds);
      for (const bird of birds) moveBird(bird, seconds);
      for (const spider of spiders) moveSpider(spider, seconds);
      for (const larva of larvae) moveLarva(larva, seconds);
      moveShrooms();
      moveMotes(seconds);
      pointer.moved = 0;
      draw();
    },
    still() {
      populate();
      const spots = blooms();
      for (const fly of flies) {
        fly.phase = 0;
        if (spots.length) fly.perch = pick(spots);
      }
      for (const bird of birds) {
        const tree = pick(standing().filter((plant) => plant.kind === TREE));
        bird.perch = tree && perchOn(tree);
        if (bird.perch) Object.assign(bird, { state: "perched", x: bird.perch.x, y: bird.perch.y, until: Infinity, hop: Infinity });
      }
      for (const spider of spiders) if (spin(spider)) moveSpider(spider, 0);
      for (const larva of larvae) {
        if (!hatch(larva)) continue;
        moveLarva(Object.assign(larva, { until: clock }), 0);
        larva.until = Infinity;
      }
      for (let i = 0; i < visitors.mushroom; i++) {
        nextShroom = clock;
        moveShrooms();
      }
      for (const shroom of shrooms) Object.assign(shroom, { born: clock - 3000, dies: Infinity });
      draw();
    },
    pointer(x, y) {
      if (pointer.here) pointer.moved += x - pointer.x;
      Object.assign(pointer, { x, y, here: true });
    },
    leave() {
      pointer.here = false;
    },
    fall(plant) {
      if (plant.puff && !plant.blown) blow(plant);
      for (const bloom of plant.blooms.slice(0, 6)) if (Math.random() < 0.6) mote("petal", bloom.x, bloom.y);
      for (let i = plant.kind === TREE ? 3 : 1; i > 0 && plant.twigs.length; i--) {
        const twig = pick(plant.twigs);
        mote("seed", twig.x, twig.y);
      }
    },
    blow,
  };
}
