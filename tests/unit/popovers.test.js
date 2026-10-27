import { describe, expect, it } from "vitest";
import { headingCards, linkCard, noteCard, paragraphHtml } from "../../src/lib/popovers.js";
import { clip } from "../../src/lib/summary.js";

describe("popover cards", () => {
  it("cut a note's opening at a sentence near 500 characters", () => {
    const sentence = "This sentence is exactly fifty characters long ok. ";
    const card = noteCard("Note", `${sentence.repeat(8)}\n\n${sentence.repeat(8)}\n\n## Heading`);
    expect(card.title).toBe("Note");
    expect(card.paragraphs.join(" ").length).toBeLessThanOrEqual(500);
    expect(card.paragraphs.at(-1)).toMatch(/ok\.$/);
  });

  it("key each heading's first paragraph by its id, skipping code", () => {
    const md = "Intro.\n\n## First *one*\n\nUnder first.\n\n```\n## Not a heading\n```\n\n## References\n\nMine.";
    expect(headingCards(md)).toEqual({
      "first-one": { title: "First one", paragraphs: ["Under first."] },
      "references-1": { title: "References", paragraphs: ["Mine."] },
    });
  });

  it("prefer an annotation to a card, and a card to the link text", () => {
    const card = { title: "Repo", meta: ["JS", "★ 3"], text: "A repo." };
    expect(linkCard({ url: "https://github.com/a/b", text: "a/b", card, annotation: "Mine." })).toEqual({
      title: "Repo",
      meta: ["JS", "★ 3"],
      paragraphs: ["Mine."],
    });
    expect(linkCard({ url: "https://github.com/a/b", text: "a/b", card })).toEqual({ title: "Repo", meta: ["JS", "★ 3"], paragraphs: ["A repo."] });
    expect(linkCard({ url: "https://www.x.org/p", text: "X" })).toEqual({ title: "X", meta: ["x.org"], paragraphs: [] });
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
