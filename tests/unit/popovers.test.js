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

  it("key each glossary term's whole definition by its id, without the etymology", () => {
    const md = "Intro.\n\n## foo (noun)\n\n1. *One* sense.\n2. Another.\n\n### Etymology\n\nFrom bar.\n\n## bar (verb)\n\nTo bar.\n\nAgain.\n";
    expect(termCards(md)).toEqual({
      "foo-noun": { title: "foo", type: "noun", paragraphs: ["1. One sense.", "2. Another."] },
      "bar-verb": { title: "bar", type: "verb", paragraphs: ["To bar.", "Again."] },
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
    expect(linkCard({ url, text: "X", card, annotation: "*Mine*.\n\nAlso mine." }).paragraphs).toEqual(["Mine.", "Also mine."]);
    expect(linkCard({ url, text: "X", card, annotation: "> Only a quote." }).paragraphs).toEqual(["From the source."]);
  });

  it("say when a link is dead", () => {
    expect(linkCard({ url: "https://x.org", text: "X", deadSince: "2026-01-02" }).dead).toBe("Archived copy. The original went dead on 2026-01-02.");
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
