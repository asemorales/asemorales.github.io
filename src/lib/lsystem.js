const FLOWER_RADIUS = 1.6;
const BRACT = 4;
const EDGE = BRACT + 1;
const CELL = 8;
const EXTINCTION = 0.008;
const RAYS = [-1, 0, 1];
const LOOK = 5;
const BEND = 40;
const STIFFNESS = 80;
const DAMPING = 4;
const PUSH = 0.2;
const MOST_SPEED = 7;
const MOST_TILT = 0.8;

const FLOWERING = {
  turn: [35, 45],
  jitter: 6,
  tips: /[aAbBcC]/g,
};

const SYSTEMS = {
  tree: [
    {
      axiom: "A",
      generations: 16,
      turn: [25, 25],
      jitter: 10,
      straighten: 0.85,
      rules: {
        A: [
          [0.4, "F[+B]-A"],
          [0.4, "F[-B]+A"],
          [0.2, "FA"],
        ],
        B: [
          [0.2, "F[+B]-B"],
          [0.2, "F[-B]+B"],
          [0.4, "FB"],
          [0.2, "F"],
        ],
      },
    },
  ],
  fern: [
    { axiom: "F", generations: 4, turn: [22, 29], jitter: 4, rules: { F: "F[+F]F[-F]F" } },
    { axiom: "X", generations: 5, turn: [18, 24], jitter: 4, rules: { X: "F[+X]F[-X]+X", F: "FF" } },
    { axiom: "X", generations: 5, turn: [22, 29], jitter: 4, rules: { X: "F[+X][-X]FX", F: "FF" } },
    {
      axiom: "F1F1F1",
      generations: 15,
      turn: [22.5, 22.5],
      jitter: 3,
      rules: { "000": "0", "001": "1[+F1F1]", "010": "1", "011": "1", 100: "0", 101: "1F1", 110: "0", 111: "0", "+": "-", "-": "+" },
    },
    {
      axiom: "F1F1F1",
      generations: 24,
      turn: [22.5, 22.5],
      jitter: 3,
      rules: { "000": "1", "001": "1[-F1F1]", "010": "1", "011": "1", 100: "0", 101: "1F1", 110: "1", 111: "0", "+": "-", "-": "+" },
    },
  ],
  flower: [
    {
      ...FLOWERING,
      axiom: "a",
      generations: 13,
      rules: {
        a: [
          [0.5, "I[L]a"],
          [0.5, "I[L]A"],
        ],
        A: [
          [0.65, "I[L][~b]A"],
          [0.35, "I[L][~b]B"],
        ],
        b: [
          [0.4, "I[L]b"],
          [0.6, "I[L]B"],
        ],
        B: [
          [0.5, "I[L][~c]B"],
          [0.5, "I[L][~c]C"],
        ],
        c: [
          [0.3, "I[L]c"],
          [0.7, "I[L]C"],
        ],
        C: [
          [0.7, "I[~IK]C"],
          [0.3, "K"],
        ],
      },
    },
    {
      ...FLOWERING,
      axiom: "a",
      generations: 8,
      rules: {
        a: [
          [0.5, "I[L]a"],
          [0.5, "I[L]A"],
        ],
        A: "I[L][~B]A",
        B: [
          [0.65, "I[L][~B]B"],
          [0.35, "K"],
        ],
      },
    },
  ],
};

export const KINDS = [
  { weight: 0.4, height: [150, 216], needs: 0.5, sun: 2, opacity: 1, room: 20, life: [240, 480], systems: SYSTEMS.tree },
  { weight: 0.3, height: [80, 135], needs: 0.2, sun: -0.5, opacity: 0.25, room: 6, life: [120, 300], systems: SYSTEMS.fern },
  { weight: 0.3, height: [50, 110], needs: 0.35, sun: 1, opacity: 0.25, room: 6, life: [60, 180], systems: SYSTEMS.flower },
];

export const TREE = KINDS[0];
export const GENERATIONS = 16;

export function reached(scrolled, viewport, page) {
  return scrolled + viewport >= 0.9 * page;
}

export function between(min, max, random = Math.random) {
  return min + Math.floor(random() * (max - min + 1));
}

export function spots(count, width, random = Math.random) {
  return Array.from({ length: count }, (_, i) => Math.round(((i + 0.2 + random() * 0.6) * width) / count));
}

function weighted(options, random) {
  let roll = random() * options.reduce((total, option) => total + option[0], 0);
  for (const option of options) {
    roll -= option[0];
    if (roll < 0) return option;
  }
  return options.at(-1);
}

function leftContext(word, i) {
  for (let j = i - 1; j >= 0; j--) {
    if (word[j] === "]") {
      for (let depth = 1; depth > 0;) {
        j--;
        if (word[j] === "]") depth++;
        if (word[j] === "[") depth--;
      }
    } else if (word[j] === "0" || word[j] === "1") return word[j];
  }
  return "1";
}

function rightContext(word, i) {
  // Skipping branches makes the Hogeweg-Hesper systems grow too many segments.
  for (let j = i + 1; j < word.length; j++) {
    if (word[j] === "]") return "1";
    if (word[j] === "0" || word[j] === "1") return word[j];
  }
  return "1";
}

export function derive({ axiom, generations, rules, tips }, random = Math.random) {
  let word = axiom;
  for (let generation = 0; generation < generations; generation++) {
    const next = [];
    for (let i = 0; i < word.length; i++) {
      const symbol = word[i];
      const key = symbol === "0" || symbol === "1" ? leftContext(word, i) + symbol + rightContext(word, i) : symbol;
      const rule = rules[key] ?? symbol;
      next.push(typeof rule === "string" ? rule : weighted(rule, random)[1]);
    }
    word = next.join("");
  }
  return tips ? word.replace(tips, "K") : word;
}

export function interpret(word, { turn: [low, high], jitter, straighten = 1, bend = 0 }, random = Math.random) {
  const turn = low + random() * (high - low);
  const angle = () => turn + (random() - 0.5) * jitter;
  const lines = [];
  const bracts = [];
  const flowers = [];
  const stack = [];
  let turtle = { x: 0, y: 0, heading: 0, reach: 0, side: random() < 0.5 ? 1 : -1 };
  for (const symbol of word) {
    if (symbol === "F" || symbol === "I") {
      turtle.heading *= straighten;
      turtle.heading += bend * Math.cos((turtle.heading * Math.PI) / 180);
      const radians = (turtle.heading * Math.PI) / 180;
      const x = turtle.x + Math.sin(radians);
      const y = turtle.y - Math.cos(radians);
      turtle.reach++;
      lines.push({ x1: turtle.x, y1: turtle.y, x2: x, y2: y, reach: turtle.reach });
      turtle.x = x;
      turtle.y = y;
    } else if (symbol === "+") turtle.heading += angle();
    else if (symbol === "-") turtle.heading -= angle();
    else if (symbol === "~") {
      const axis = stack.at(-1);
      turtle.heading += axis.side * angle();
      axis.side *= -1;
    } else if (symbol === "[") {
      stack.push(turtle);
      turtle = { ...turtle };
    } else if (symbol === "]") turtle = stack.pop();
    else if (symbol === "L") bracts.push({ ...turtle, side: random() < 0.5 ? 1 : -1 });
    else if (symbol === "K") flowers.push({ ...turtle });
  }
  return { lines, bracts, flowers };
}

const round = (value) => +value.toFixed(1);

export function choose(kinds, random = Math.random, light = 1) {
  return weighted(
    kinds.map((kind) => [kind.weight * light ** kind.sun, kind]),
    random,
  )[1];
}

export function sprout(kind, x, ground, width, random = Math.random, { light = 1, lean = 0 } = {}) {
  const system = kind.systems[Math.floor(random() * kind.systems.length)];
  const word = derive(system, random);
  const facing = random() < 0.5 ? 1 : -1;
  let shape = interpret(word, system, random);
  if (lean) {
    const span = shape.lines.reduce((far, line) => Math.max(far, line.reach), 1);
    shape = interpret(word, { ...system, bend: (lean * facing) / span }, random);
  }
  const { lines, bracts, flowers } = shape;

  const target = kind.height[0] + random() * (kind.height[1] - kind.height[0]) * light;
  const sides = lines.map((line) => line.x2 * facing);
  const low = Math.min(0, ...sides);
  const high = Math.max(0, ...sides);
  const scale = Math.min(target / -lines.reduce((top, line) => Math.min(top, line.y2), 0), (width - 2 * EDGE) / (high - low));
  const base = Math.max(EDGE - low * scale, Math.min(x, width - EDGE - high * scale));
  const left = (value) => round(base + value * scale * facing);
  const top = (value) => round(ground + value * scale);

  const reach = lines.reduce((far, line) => Math.max(far, line.reach), 0);
  const layers = Array.from({ length: GENERATIONS }, () => "");
  const layer = (at) => Math.floor(((at - 1) / reach) * GENERATIONS);

  const cells = new Map();
  for (const line of lines) {
    layers[layer(line.reach)] += `M${left(line.x1)} ${top(line.y1)}L${left(line.x2)} ${top(line.y2)}`;
    const col = Math.floor(left((line.x1 + line.x2) / 2) / CELL);
    const row = Math.floor(top((line.y1 + line.y2) / 2) / CELL);
    const key = `${col} ${row}`;
    cells.set(key, { col, row, length: (cells.get(key)?.length ?? 0) + scale * kind.opacity });
  }
  for (const bract of bracts) {
    const radians = ((bract.heading + 60 * bract.side) * Math.PI) / 180;
    const dx = round(BRACT * Math.sin(radians));
    const dy = round(-BRACT * Math.cos(radians));
    layers[layer(bract.reach)] += `M${left(bract.x)} ${top(bract.y)}q${round(dx * 0.2)} ${round(dy * 1.1)} ${dx} ${dy}`;
  }
  for (const flower of flowers) {
    const d = FLOWER_RADIUS * 2;
    layers[layer(flower.reach)] +=
      `M${round(left(flower.x) - FLOWER_RADIUS)} ${top(flower.y)}a${FLOWER_RADIUS} ${FLOWER_RADIUS} 0 1 0 ${d} 0a${FLOWER_RADIUS} ${FLOWER_RADIUS} 0 1 0 ${-d} 0`;
  }
  return { kind, x, base, layers, foliage: [...cells.values()] };
}

export function canopy(width, height) {
  const cols = Math.ceil(width / CELL) + 1;
  const rows = Math.ceil(height / CELL) + 1;
  return { cols, rows, density: new Float64Array(cols * rows), plants: [] };
}

function shift({ cols, density }, foliage, sign) {
  for (const { col, row, length } of foliage) density[row * cols + col] += sign * length;
}

export function skylight({ cols, density }, col, row) {
  let total = 0;
  for (const ray of RAYS) {
    let area = 0;
    for (let c = col + ray, r = row - 1; r >= 0 && c >= 0 && c < cols; c += ray, r--) area += density[r * cols + c];
    total += Math.exp(-EXTINCTION * area);
  }
  return total / RAYS.length;
}

function exposure(garden, foliage) {
  let lit = 0;
  let area = 0;
  for (const { col, row, length } of foliage) {
    lit += length * skylight(garden, col, row);
    area += length;
  }
  return area ? lit / area : 1;
}

export function lightOn(garden, plant) {
  const held = garden.plants.includes(plant);
  if (held) shift(garden, plant.foliage, -1);
  const light = exposure(garden, plant.foliage);
  if (held) shift(garden, plant.foliage, 1);
  return light;
}

function admit(garden, plant) {
  if (garden.plants.some((other) => Math.abs(other.base - plant.base) < other.kind.room + plant.kind.room)) return false;
  if (lightOn(garden, plant) < plant.kind.needs) return false;
  shift(garden, plant.foliage, 1);
  garden.plants.push(plant);
  if (garden.plants.every((other) => lightOn(garden, other) >= other.kind.needs)) return true;
  remove(garden, plant);
  return false;
}

export function remove(garden, plant) {
  shift(garden, plant.foliage, -1);
  garden.plants.splice(garden.plants.indexOf(plant), 1);
}

export function establish(garden, kinds, x, ground, width, random = Math.random) {
  const col = Math.floor(x / CELL);
  let pool = kinds;
  while (pool.length) {
    const kind = choose(pool, random, skylight(garden, col, garden.rows - 1));
    const row = Math.floor((ground - kind.height[0]) / CELL);
    const plant = sprout(kind, x, ground, width, random, {
      light: skylight(garden, col, row),
      lean: BEND * (skylight(garden, col + LOOK, row) - skylight(garden, col - LOOK, row)),
    });
    if (admit(garden, plant)) return plant;
    pool = pool.filter((other) => other !== kind);
  }
  return null;
}

export function plantNear({ plants }, x, y) {
  const col = Math.floor(x / CELL);
  const row = Math.floor(y / CELL);
  const near = plants.filter(({ foliage }) => foliage.some((cell) => Math.abs(cell.col - col) <= 1 && Math.abs(cell.row - row) <= 1));
  return near.reduce((best, plant) => (!best || Math.abs(plant.base - x) < Math.abs(best.base - x) ? plant : best), null);
}

const within = (value, limit) => Math.max(-limit, Math.min(limit, value));

export function brush(plant, pixels) {
  plant.speed = within(plant.speed + pixels * PUSH, MOST_SPEED);
}

export function swing(plant, seconds) {
  plant.speed += (-STIFFNESS * plant.tilt - DAMPING * plant.speed) * seconds;
  plant.tilt = within(plant.tilt + plant.speed * seconds, MOST_TILT);
  const moving = Math.abs(plant.tilt) > 0.005 || Math.abs(plant.speed) > 0.05;
  if (!moving) plant.tilt = plant.speed = 0;
  return moving;
}
