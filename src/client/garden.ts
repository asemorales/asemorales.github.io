import { GENERATIONS, KINDS, TREE, between, brush, canopy, establish, plantNear, reached, remove, spots, swing } from "../lib/lsystem.js";
import { census, inhabit, recent } from "../lib/wildlife.js";

type Plant = NonNullable<ReturnType<typeof establish>> & {
  path: SVGPathElement;
  generation: number;
  tilt: number;
  speed: number;
  due: number;
};

export function grow(root: HTMLElement) {
  const STEP = 300;
  const WITHER = 900;

  const svg = root.querySelector(".plants")!;
  const { width, height } = root.getBoundingClientRect();
  const styles = getComputedStyle(root);
  const desktop = styles.getPropertyValue("--desktop") === "1";
  const free = spots(Number(styles.getPropertyValue("--plants")), width);
  const garden: ReturnType<typeof canopy> & { plants: Plant[] } = canopy(width, height);
  const maxTrees = Number(styles.getPropertyValue("--trees"));

  let trees = 0;
  let growing: Plant[] = [];
  let standing: Plant[] = [];
  let dying: Plant[] = [];
  let concurrent = between(1, 3);
  let nextStart = 0;
  let frame = 0;
  let clock = 0;
  let last = 0;
  let settled = false;
  let hovered: Plant | null = null;
  let pointerX = 0;
  let pointerY = 0;
  let swaying = 0;
  let swayed = 0;
  const rustling = new Set<Plant>();

  function start(index = between(0, free.length - 1), x = free[index], pool = KINDS) {
    const kinds = trees < maxTrees ? pool : pool.filter((k) => k !== TREE);
    const plant = establish(garden, kinds, x, height, width);
    if (!plant) return false;
    plant.x = free.splice(index, 1)[0];
    if (plant.kind === TREE) trees++;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.style.transformOrigin = `${plant.base}px ${height}px`;
    svg.append(path);
    growing.push(Object.assign(plant, { path, generation: 0, due: 0, tilt: 0, speed: 0 }));
    return true;
  }

  function step(plant: Plant) {
    plant.path.setAttribute("d", (plant.path.getAttribute("d") ?? "") + plant.layers[plant.generation++]);
  }

  function age(plant: Plant) {
    const [shortest, longest] = plant.kind.life;
    plant.due = clock + between(shortest, longest) * 1000;
    standing.push(plant);
  }

  function complete() {
    for (const plant of growing) {
      while (plant.generation < GENERATIONS) step(plant);
      age(plant);
    }
    growing = [];
  }

  function wither(plant: Plant) {
    plant.generation--;
    plant.path.setAttribute("d", plant.layers.slice(0, plant.generation).join(""));
    plant.due = clock + WITHER;
    if (plant.generation > 0) return;
    plant.path.remove();
    if (garden.plants.includes(plant)) release(plant);
  }

  function release(plant: Plant) {
    remove(garden, plant);
    free.push(plant.x);
    if (plant.kind === TREE) trees--;
  }

  function sow(x: number, pool = KINDS) {
    if (!free.length) return;
    const index = free.reduce((best, spot, i) => (Math.abs(spot - x) < Math.abs(free[best] - x) ? i : best), 0);
    if (Math.abs(free[index] - x) < 30) start(index, x, pool);
  }

  function rustle(plant: Plant, pixels: number) {
    brush(plant, pixels);
    rustling.add(plant);
    if (!swaying) {
      swayed = performance.now();
      swaying = requestAnimationFrame(sway);
    }
  }

  const tended = (root.dataset.tended ?? "").split(" ").filter(Boolean).map(Date.parse);
  const wildlife = inhabit(root.querySelector(".wildlife")!, {
    width,
    height,
    garden,
    visitors: census(recent(tended, Date.now()), desktop ? 12 : 6),
    standing: () => standing,
    sow,
    touch: (plant: Plant, pixels: number) => {
      if (!calm()) rustle(plant, pixels);
    },
  });

  function tick(now: number) {
    const elapsed = Math.min(now - last, 100);
    clock += elapsed;
    last = now;
    if (free.length && growing.length < concurrent && clock >= nextStart) {
      start();
      nextStart = clock + between(1000, 3000);
    }
    for (const plant of growing) {
      if (clock >= plant.due) {
        step(plant);
        plant.due = clock + STEP;
      }
    }
    const unfinished = growing.filter((plant) => plant.generation < GENERATIONS);
    if (unfinished.length < growing.length) concurrent = between(1, 3);
    growing.filter((plant) => plant.generation >= GENERATIONS).forEach(age);
    growing = unfinished;

    const due = standing.filter((plant) => clock >= plant.due);
    due.forEach(wildlife.fall);
    dying.push(...due);
    standing = standing.filter((plant) => clock < plant.due);
    for (const plant of dying) if (clock >= plant.due) wither(plant);
    dying = dying.filter((plant) => plant.generation > 0);
    wildlife.step(elapsed / 1000);
    frame = requestAnimationFrame(tick);
  }

  function calm() {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function plantAt({ clientX }: MouseEvent) {
    const { left } = root.getBoundingClientRect();
    const x = clientX - left;
    const nearest = free.reduce((best, spot, index) => (Math.abs(spot - x) < Math.abs(free[best] - x) ? index : best), 0);
    const crowding = standing.reduce<Plant | null>(
      (best, plant) => (!best || Math.abs(plant.base - x) < Math.abs(best.base - x) ? plant : best),
      null,
    );
    if (!(free.length && start(nearest, x)) && crowding) {
      standing.splice(standing.indexOf(crowding), 1);
      release(crowding);
      if (!start(free.length - 1, x)) start(free.length - 1, crowding.base);
      if (calm()) {
        crowding.path.remove();
      } else {
        wildlife.fall(crowding);
        crowding.due = clock;
        dying.push(crowding);
      }
    }
    if (calm()) {
      complete();
      wildlife.still();
    }
  }

  function sway(now: number) {
    const seconds = Math.max(0, Math.min(now - swayed, 50)) / 1000;
    swayed = now;
    for (const plant of rustling) {
      const moving = swing(plant, seconds);
      plant.path.style.transform = moving ? `skewX(${-plant.tilt}deg)` : "";
      if (!moving) rustling.delete(plant);
    }
    swaying = rustling.size ? requestAnimationFrame(sway) : 0;
  }

  function track({ clientX, clientY }: PointerEvent) {
    pointerX = clientX;
    pointerY = clientY;
  }

  function disturb(event: PointerEvent) {
    const across = event.clientX - pointerX;
    const along = Math.abs(event.clientY - pointerY);
    track(event);
    if (calm()) return;
    const { left, top } = root.getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;
    if (event.type === "pointerleave") wildlife.leave();
    else wildlife.pointer(x, y);
    const next = event.type === "pointerleave" ? null : (plantNear(garden, x, y) as Plant | null);
    for (const plant of new Set([hovered, next])) {
      if (!plant) continue;
      rustle(plant, across + (along / 2) * Math.sign(x - plant.base));
      wildlife.blow(plant, across);
    }
    hovered = next;
  }

  function update() {
    const ready = reached(scrollY, innerHeight, document.documentElement.scrollHeight);
    if (settled) return;
    if (!ready) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (calm()) {
      cancelAnimationFrame(frame);
      for (let index = free.length - 1; index >= 0; index--) start(index);
      complete();
      wildlife.still();
      settled = true;
    } else if (!frame) {
      frame = requestAnimationFrame(tick);
    }
  }

  for (let i = desktop ? between(3, 4) : between(1, 2); i > 0; i--) start();
  complete();
  update();

  root.addEventListener("click", plantAt);
  root.addEventListener("pointerenter", track);
  root.addEventListener("pointermove", disturb);
  root.addEventListener("pointerleave", disturb);
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", update);
  new ResizeObserver(update).observe(document.documentElement);
}
