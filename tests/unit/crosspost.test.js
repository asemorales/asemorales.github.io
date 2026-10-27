import { describe, expect, it } from "vitest";
import { compose, pending } from "../../scripts/crosspost.js";

describe("crosspost", () => {
  it("posts the title, the opening paragraph with TeX delimiters, and the link", () => {
    const status = compose({ title: "Rice's Theorem", slug: "rices-theorem", body: "Every property of $\\varphi_e$ is undecidable.\n\nMore." });
    expect(status).toBe("Rice's Theorem\n\nEvery property of \\(\\varphi_e\\) is undecidable.\n\nhttps://asemorales.com/rices-theorem/");
  });

  it("fits in 500 characters, counting the link as 23", () => {
    const body = "A sentence that keeps going for a while. ".repeat(40);
    const status = compose({ title: "Long", slug: "a-very-long-slug-that-would-not-fit-otherwise", body });
    const [title, lead] = status.split("\n\n");
    expect(title.length + lead.length + 4 + 23).toBeLessThanOrEqual(500);
  });

  it("posts listed notes once, oldest first", () => {
    const notes = [
      { slug: "b", date: "2026-02-01" },
      { slug: "a", date: "2026-01-01" },
      { slug: "c", date: "2026-03-01", unlisted: true },
      { slug: "d", date: "2025-12-01" },
    ];
    expect(pending(notes, { d: {} }).map((n) => n.slug)).toEqual(["a", "b"]);
  });
});
