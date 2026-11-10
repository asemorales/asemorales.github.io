import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import HomeTopic from "../../src/components/HomeTopic.astro";
import NoteGraph from "../../src/components/NoteGraph.astro";
import { noteGraph } from "../../src/lib/graph.js";

const note = (id, date, body = "") => ({ id, title: id.toUpperCase(), date: new Date(date), body });
const render = async (component, props) => (await AstroContainer.create()).renderToString(component, { props });

describe("noteGraph", () => {
  const { nodes, edges } = noteGraph([
    note("late", "2026-03-01", "[[early]] [[private]] [[late]]"),
    note("alone", "2026-01-01"),
    note("mid", "2026-02-01", "[[late]]"),
    note("early", "2026-01-01", "[[late]]"),
  ]);
  const node = (id) => nodes.find((n) => n.id === id);

  it("orders notes from the earliest at the top to the latest at the bottom", () => {
    expect(nodes.map((n) => n.id)).toEqual(["alone", "early", "mid", "late"]);
    expect(nodes.map((n) => n.y)).toEqual(nodes.map((n) => n.y).sort((a, b) => a - b));
  });

  it("keeps every note inside the plot", () => {
    const many = noteGraph(Array.from({ length: 60 }, (_, i) => note(`n${i}`, "2026-01-01", `[[n${i + 1}]]`)));
    expect(many.nodes.every((n) => n.x > 0 && n.x < 1 && n.y >= 0 && n.y <= 1)).toBe(true);
  });

  it("joins each linked pair once, and skips self-links, and unknown notes", () => {
    expect(edges.map((e) => [e.a, e.b])).toEqual([
      ["early", "late"],
      ["mid", "late"],
    ]);
    expect(node("late").links).toEqual(["early", "mid"]);
    expect(node("alone").links).toEqual([]);
  });
});

describe("NoteGraph", () => {
  it("links each node to its note and names the notes linked with it", async () => {
    const html = await render(NoteGraph, { notes: [note("a", "2026-01-01", "[[b]]"), note("b", "2026-02-01")] });
    expect(html).toMatch(/<a href="\/a\/"[^>]*aria-label="A, linked with B"/);
    expect(html.match(/<path /g)).toHaveLength(1);
  });

  it("renders nothing without notes", async () => {
    expect(await render(NoteGraph, { notes: [] })).not.toContain("note-graph");
  });
});

describe("HomeTopic", () => {
  const notes = (n) => Array.from({ length: n }, (_, i) => ({ id: `n${i}`, body: "", data: { title: `N${i}`, tags: ["topic"] } }));

  it("folds notes after the fifth into a dropdown", async () => {
    const html = await render(HomeTopic, { tag: "topic", notes: notes(7) });
    const [shown, folded] = html.split("<details");
    expect(shown.match(/<li/g)).toHaveLength(5);
    expect(folded).toContain("See 2 more");
    expect(folded.match(/<li/g)).toHaveLength(2);
    expect(await render(HomeTopic, { tag: "topic", notes: notes(5) })).not.toContain("<details");
  });
});
