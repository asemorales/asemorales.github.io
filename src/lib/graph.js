import { linkTargets } from "./wikilinks.js";

const byDate = (a, b) => a.date - b.date || a.id.localeCompare(b.id);

const round = (n) => Math.round(n * 100) / 100;

function curve(a, b) {
  const [x1, y1, x2, y2] = [a.x * 100, a.y * 100, b.x * 100, b.y * 100];
  const [dx, dy] = [(x2 - x1) * 0.08, (y2 - y1) * 0.55];
  return `M${round(x1)} ${round(y1)}C${round(x1 + dx)} ${round(y1 + dy)} ${round(x2 - dx)} ${round(y2 - dy)} ${round(x2)} ${round(y2)}`;
}

const LANES = 8;
const PULL = 0.5;
const SCATTER = { x: 0.4, y: 0.25 };

function scatter(id, salt) {
  let h = salt;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  return ((h ^ (h >>> 13)) >>> 0) / 2 ** 31 - 1;
}

export function noteGraph(notes) {
  const sorted = [...notes].sort(byDate);
  const byId = new Map(sorted.map((n) => [n.id, n]));
  const links = new Map(sorted.map((n) => [n.id, new Set()]));
  for (const n of sorted) {
    for (const target of linkTargets(n.body ?? "")) {
      if (target === n.id || !byId.has(target)) continue;
      links.get(n.id).add(target);
      links.get(target).add(n.id);
    }
  }
  const linked = (id) => sorted.filter((n) => links.get(id).has(n.id)).map((n) => n.id);

  const t = (i) => (sorted.length > 1 ? i / (sorted.length - 1) : 0.5);
  const lane = new Map();
  const pairs = sorted.flatMap((a, u) => sorted.flatMap((b, v) => (u < v && links.get(a.id).has(b.id) ? [[u, v]] : [])));
  const laneOf = (j, i, at) => (j === i ? at : lane.get(sorted[j].id));
  const crossing = (i, at) =>
    pairs.reduce((sum, [u, v]) => {
      const [from, to] = [laneOf(u, i, at), laneOf(v, i, at)];
      if (from === undefined || to === undefined) return sum;
      const between = u === i || v === i ? sorted.map((_, j) => j).slice(u + 1, v) : u < i && i < v ? [i] : [];
      return between.reduce((part, j) => {
        const d = laneOf(j, i, at) - (from + ((to - from) * (j - u)) / (v - u));
        return d === d ? part + 1 / (d * d + 0.25) : part;
      }, sum);
    }, 0);
  const cost = (i, at) =>
    sorted.reduce(
      (sum, other, j) => {
        const taken = lane.get(other.id);
        if (j === i || taken === undefined) return sum;
        const dt = (t(i) - t(j)) * LANES;
        const dl = at - taken;
        const pull = links.get(sorted[i].id).has(other.id) ? PULL * Math.abs(dl) : 0;
        return sum + pull + 1 / (dt * dt + dl * dl + 0.01);
      },
      Math.abs(at - (LANES - 1) / 2) / 1000 + crossing(i, at),
    );
  for (let pass = 0; pass < 3; pass++) {
    sorted.forEach((n, i) => {
      lane.delete(n.id);
      let best = 0;
      for (let at = 1; at < LANES; at++) if (cost(i, at) < cost(i, best)) best = at;
      lane.set(n.id, best);
    });
  }

  const pitch = 1 / Math.max(1, sorted.length - 1);
  const nodes = sorted.map((n, i) => {
    const x = (lane.get(n.id) + 0.5 + scatter(n.id, 1) * SCATTER.x) / LANES;
    const y = Math.min(1, Math.max(0, t(i) + scatter(n.id, 2) * SCATTER.y * pitch));
    return { id: n.id, title: n.title, x, y, links: linked(n.id), left: x > 0.5 };
  });
  const edges = nodes.flatMap((a, i) =>
    nodes
      .slice(i + 1)
      .filter((b) => a.links.includes(b.id))
      .map((b) => ({ a: a.id, b: b.id, d: curve(a, b) })),
  );
  return { nodes, edges };
}
