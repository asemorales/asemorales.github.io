import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import NoteFooter from "../../src/components/NoteFooter.astro";
import { notesWithSeeAlso, seeAlsoLists } from "../../src/lib/wikilinks.js";

const note = (id, title, body = "", data = {}) => ({ id, body, data: { title, ...data } });
const labels = (lists) => lists.map((l) => l.count(l.notes.length));
const titles = (lists) => lists.map((l) => l.notes.map((n) => n.data.title));

describe("seeAlsoLists", () => {
  it("lists links to other notes, then notes that link here, each by title", () => {
    const here = note("here", "Here", "[[zeta]] [[alpha]]");
    const notes = [
      here,
      note("zeta", "Zeta"),
      note("alpha", "Alpha"),
      note("back-b", "Back B", "[[here]]"),
      note("back-a", "Back A", "[[here#Part|x]]"),
    ];
    const lists = seeAlsoLists(here, notes);
    expect(labels(lists)).toEqual(["2 links to other notes", "2 notes that link here"]);
    expect(titles(lists)).toEqual([
      ["Alpha", "Zeta"],
      ["Back A", "Back B"],
    ]);
  });

  it("uses the singular for one note", () => {
    const here = note("here", "Here", "[[out]]");
    expect(labels(seeAlsoLists(here, [here, note("out", "Out"), note("in", "In", "[[here]]")]))).toEqual([
      "1 link to another note",
      "1 note that links here",
    ]);
  });

  it("counts a note linked twice once, and leaves out the note itself and unpublished notes", () => {
    const here = note("here", "Here", "[[out]] [[out#Part]] [[here#Part]] [[private]]");
    expect(titles(seeAlsoLists(here, [here, note("out", "Out")]))).toEqual([["Out"]]);
  });

  it("includes unlisted notes", () => {
    const here = note("here", "Here");
    expect(titles(seeAlsoLists(here, [here, note("hidden", "Hidden", "[[here]]", { unlisted: true })]))).toEqual([["Hidden"]]);
  });

  it("drops empty lists", () => {
    const here = note("here", "Here");
    expect(seeAlsoLists(here, [here, note("other", "Other")])).toEqual([]);
  });
});

describe("notesWithSeeAlso", () => {
  it("names notes that link out and notes linked to, but not self-links or unpublished targets", () => {
    const notes = [
      { id: "a", body: "[[b]] [[private]]" },
      { id: "b", body: "" },
      { id: "c", body: "[[c#Part]] [[private]]" },
    ];
    expect(new Set(notesWithSeeAlso(notes))).toEqual(new Set(["a", "b"]));
  });
});

describe("NoteFooter", () => {
  const render = async (seeAlso) => (await AstroContainer.create()).renderToString(NoteFooter, { props: { seeAlso, lists: [], tags: [] } });

  it("renders each See also list as an open dropdown", async () => {
    const out = note("out", "Out");
    const html = await render([
      { count: () => "1 link to another note", notes: [out] },
      { count: () => "2 notes that link here", notes: [note("in", "In")] },
    ]);
    expect(html.match(/<details open/g)).toHaveLength(2);
    expect(html.indexOf("1 link to another note")).toBeLessThan(html.indexOf("2 notes that link here"));
    expect(html).toContain('<a href="/out/">Out</a>');
  });

  it("omits See also when there are no lists", async () => {
    expect(await render([])).not.toContain("see-also");
  });
});
