const LENGTH = 12;
const TURN = 25;
const TURN_JITTER = 10;
const STRAIGHTEN = 0.85;

const RULES = {
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
};

export const GENERATIONS = 16;

export function reached(scrolled, viewport, page) {
  return scrolled + viewport >= 0.9 * page;
}

function successor(symbol, random) {
  const rules = RULES[symbol];
  let roll = random();
  for (const [weight, rule] of rules) {
    roll -= weight;
    if (roll < 0) return rule;
  }
  return rules.at(-1)[1];
}

export function grow(apices, random = Math.random) {
  const next = [];
  let path = "";
  for (const apex of apices) {
    let turtle = { ...apex, heading: apex.heading * STRAIGHTEN };
    const stack = [];
    for (const symbol of successor(apex.symbol, random)) {
      if (symbol === "F") {
        const radians = (turtle.heading * Math.PI) / 180;
        const x = +(turtle.x + LENGTH * Math.sin(radians)).toFixed(1);
        const y = +(turtle.y - LENGTH * Math.cos(radians)).toFixed(1);
        path += `M${turtle.x} ${turtle.y}L${x} ${y}`;
        turtle = { ...turtle, x, y };
      } else if (symbol === "+" || symbol === "-") {
        const turn = TURN + (random() - 0.5) * TURN_JITTER;
        turtle.heading += symbol === "+" ? turn : -turn;
      } else if (symbol === "[") {
        stack.push(turtle);
        turtle = { ...turtle };
      } else if (symbol === "]") {
        turtle = stack.pop();
      } else {
        next.push({ ...turtle, symbol });
      }
    }
  }
  return { apices: next, path };
}
