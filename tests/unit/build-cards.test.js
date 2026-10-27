import { describe, expect, it } from "vitest";
import { classify, openalexAbstract, parseArxiv, parseCrossref, parseGithub, parsePage } from "../../scripts/build-cards.js";

describe("build-cards", () => {
  it.each([
    ["https://github.com/asemorales/bierstadt", { kind: "github", id: "asemorales/bierstadt" }],
    ["https://github.com/asemorales/bierstadt/issues", { kind: "page" }],
    ["https://arxiv.org/abs/1706.03762v5", { kind: "arxiv", id: "1706.03762" }],
    ["https://arxiv.org/pdf/1706.03762.pdf", { kind: "arxiv", id: "1706.03762" }],
    ["https://doi.org/10.1145/3663976.3664235", { kind: "doi", id: "10.1145/3663976.3664235" }],
    ["https://en.wikipedia.org/wiki/Halting_problem", { kind: "wikipedia", id: "Halting_problem", lang: "en" }],
    ["https://gwern.net/design", { kind: "page" }],
  ])("classifies %s", (url, expected) => expect(classify(url)).toEqual(expected));

  it("reads an arXiv entry", () => {
    const xml = `<feed><entry><title>A  Title</title><published>2017-06-12T00:00:00Z</published><summary>Short &amp; sweet.</summary>
      <author><name>A</name></author><author><name>B</name></author><author><name>C</name></author><author><name>D</name></author></entry></feed>`;
    expect(parseArxiv(xml)).toEqual({ title: "A Title", meta: ["A et al.", "arXiv", "2017"], text: "Short & sweet." });
  });

  it("reads a Crossref work, stripping JATS from the abstract", () => {
    const work = {
      message: {
        title: ["T"],
        author: [{ given: "A. M.", family: "Turing" }],
        "container-title": ["J"],
        issued: { "date-parts": [[1937]] },
        abstract: "<jats:p>Abstract Text.</jats:p>",
      },
    };
    expect(parseCrossref(work)).toEqual({ title: "T", meta: ["A. M. Turing", "J", "1937"], text: "Text." });
  });

  it("rebuilds an OpenAlex abstract from word positions", () => {
    expect(openalexAbstract({ abstract_inverted_index: { Abstract: [0], We: [1], prove: [2], it: [3], "it.": [4] } })).toBe("We prove it it.");
    expect(openalexAbstract({ abstract_inverted_index: null })).toBe("");
    expect(openalexAbstract(null)).toBe("");
  });

  it("reads a GitHub repo and a page title", () => {
    expect(parseGithub({ full_name: "a/b", language: null, stargazers_count: 1234, description: " D " })).toEqual({
      title: "a/b",
      meta: ["GitHub", "★ 1,234"],
      text: "D",
    });
    expect(parsePage("<html><title>\n Hi &amp; bye </title>")).toEqual({ title: "Hi & bye", meta: [], text: "" });
  });
});
