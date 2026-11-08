import { describe, expect, it } from "vitest";
import { headingCards, linkCard, noteCard, paragraphHtml, termCards } from "../../src/lib/popovers.js";
import { clip } from "../../src/lib/summary.js";

describe("popover cards", () => {
  it("cut a note's first paragraph at a sentence near 500 characters", () => {
    const sentence = "This sentence is exactly fifty characters long ok. ";
    const card = noteCard("Note", `${sentence.repeat(12)}\n\nSecond paragraph.\n\n## Heading`);
    expect(card.title).toBe("Note");
    expect(card.paragraphs).toHaveLength(1);
    expect(card.paragraphs[0].length).toBeLessThanOrEqual(500);
    expect(card.paragraphs.at(-1)).toMatch(/ok\.$/);
  });

  it("show a note's opening epigraph above its first paragraph", () => {
    const md = "> [!quote] Jorge Luis Borges, *[Babel](https://x.org/a)*\n> The *universe*\n> is a library.\n\nFirst.\n\nSecond.";
    expect(noteCard("Note", md)).toEqual({
      title: "Note",
      epigraph: { text: "The universe is a library.", by: "Jorge Luis Borges, Babel" },
      paragraphs: ["First."],
    });
    expect(noteCard("Note", "> [!quote]\n> Alone.").epigraph).toEqual({ text: "Alone.", by: "" });
    expect(noteCard("Note", "> [!status]\n> Draft.\n\nFirst.")).toEqual({ title: "Note", paragraphs: [] });
    expect(noteCard("Note", "First.\n\n> [!quote] Borges\n> Later.")).toEqual({ title: "Note", paragraphs: ["First."] });
  });

  it("key each heading's first paragraph by its id, skipping code", () => {
    const md = "Intro.\n\n## First *one*\n\nUnder first.\n\n```\n## Not a heading\n```\n\n## References\n\nMine.";
    expect(headingCards(md)).toEqual({
      "first-one": { title: "First one", paragraphs: ["Under first."] },
      "references-1": { title: "References", paragraphs: ["Mine."] },
    });
  });

  it("key each glossary term's definition callout by its id, with its sections", () => {
    const md =
      "Intro.\n\n## foo (noun)\n\n> [!definition]\n> 1. *One* sense.\n> 2. Another.\n>\n> ### Examples\n>\n> - a foo\n> - b foo\n>\n> ### Etymology\n>\n> > [!quote] Smith, *Words*\n> > From bar.\n\n" +
      "## bar (verb)\n\n> [!definition]\n> To bar.\n>\n> Again.\n\n[^1]: Not part of the definition.\n";
    expect(termCards(md)).toEqual({
      "foo-noun": {
        title: "foo",
        type: "noun",
        paragraphs: ["1. One sense.", "2. Another."],
        sections: [
          { title: "Examples", paragraphs: ["• a foo", "• b foo"] },
          { title: "Etymology", epigraph: { text: "From bar.", by: "Smith, Words" }, paragraphs: [] },
        ],
      },
      "bar-verb": { title: "bar", type: "verb", paragraphs: ["To bar.", "Again."], sections: [] },
    });
  });

  it("keep a term's attributed quotes in place, wherever they fall in the definition", () => {
    const md =
      "## foo (noun)\n\n> [!definition]\n> A foo.\n>\n> > [!quote] Smith\n> > Quoted.\n>\n> After.\n>\n> ### Etymology\n>\n> From bar.\n>\n> > [!quote] Tao\n> > Also quoted.\n";
    expect(termCards(md)["foo-noun"]).toEqual({
      title: "foo",
      type: "noun",
      paragraphs: ["A foo."],
      sections: [
        { epigraph: { text: "Quoted.", by: "Smith" }, paragraphs: ["After."] },
        { title: "Etymology", paragraphs: ["From bar."] },
        { epigraph: { text: "Also quoted.", by: "Tao" }, paragraphs: [] },
      ],
    });
  });

  it("prefer a card to the link text", () => {
    const card = { title: "Repo", meta: ["JS", "★ 3"], text: "A repo." };
    expect(linkCard({ url: "https://github.com/a/b", text: "a/b", card })).toEqual({ title: "Repo", meta: ["JS", "★ 3"], paragraphs: ["A repo."] });
    expect(linkCard({ url: "https://www.x.org/p", text: "X" })).toEqual({ title: "X", meta: ["x.org"], paragraphs: [] });
  });

  it("prefer an annotation to the source's first paragraph", () => {
    const card = { title: "Repo", meta: [], text: "From the source." };
    const url = "https://x.org";
    const title = "Mine";
    expect(linkCard({ url, text: "X", card, annotation: { title, body: "*Mine*.\n\nAlso mine." } }).paragraphs).toEqual(["Mine.", "Also mine."]);
    expect(linkCard({ url, text: "X", card, annotation: { title, body: "> Only a quote." } }).paragraphs).toEqual(["From the source."]);
  });

  it("prefer an annotation's title to the card's", () => {
    const card = { title: "Repo", meta: [], text: "From the source." };
    expect(linkCard({ url: "https://x.org", text: "X", card, annotation: { title: "Mine", body: "Text." } }).title).toBe("Mine");
  });

  it("show when a link is dead", () => {
    expect(linkCard({ url: "https://x.org", text: "X", deadSince: "2026-01-02" }).dead).toBe(
      "This redirects to an archived copy since the source is no longer available.",
    );
  });

  it("clip at a sentence, or at a word with an ellipsis", () => {
    expect(clip("One two three. Four five six.", 20)).toBe("One two three.");
    expect(clip("One two. Three four five six.", 20)).toBe("One two. Three four…");
    expect(clip("Onetwothree fourfive sixseven", 20)).toBe("Onetwothree…");
  });
});

describe("paragraphHtml", () => {
  it("escapes text and draws inline math as SVG", () => {
    const html = paragraphHtml("a < b, and $x^2$ too");
    expect(html).toMatch(/^a &lt; b, and <mjx-container[^>]*jax="SVG"[^>]*><svg[^>]*aria-label="x\^2"/);
    expect(html).toMatch(/<\/mjx-container> too$/);
  });
});
