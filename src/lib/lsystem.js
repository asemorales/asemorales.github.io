const FLOWER_RADIUS = 1.6;
const BRACT = 4;

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
  { weight: 0.4, height: [150, 216], systems: SYSTEMS.tree },
  { weight: 0.3, height: [80, 135], systems: SYSTEMS.fern },
  { weight: 0.3, height: [50, 110], systems: SYSTEMS.flower },
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

export function interpret(word, { turn: [low, high], jitter, straighten = 1 }, random = Math.random) {
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

export function choose(kinds, random = Math.random) {
  return weighted(
    kinds.map((kind) => [kind.weight, kind]),
    random,
  )[1];
}

export function sprout(kind, x, ground, random = Math.random) {
  const system = kind.systems[Math.floor(random() * kind.systems.length)];
  const { lines, bracts, flowers } = interpret(derive(system, random), system, random);

  const target = kind.height[0] + random() * (kind.height[1] - kind.height[0]);
  const scale = target / -lines.reduce((top, line) => Math.min(top, line.y2), 0);
  const facing = random() < 0.5 ? 1 : -1;
  const left = (value) => round(x + value * scale * facing);
  const top = (value) => round(ground + value * scale);

  const reach = lines.reduce((far, line) => Math.max(far, line.reach), 0);
  const layers = Array.from({ length: GENERATIONS }, () => "");
  const layer = (at) => Math.floor(((at - 1) / reach) * GENERATIONS);

  for (const line of lines) layers[layer(line.reach)] += `M${left(line.x1)} ${top(line.y1)}L${left(line.x2)} ${top(line.y2)}`;
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
  return layers;
}
