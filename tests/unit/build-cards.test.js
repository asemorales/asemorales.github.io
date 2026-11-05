import { describe, expect, it } from "vitest";
import { classify, notesByLink, openalexAbstract, parseArxiv, parseCrossref, parseGithub, parsePage } from "../../scripts/build-cards.js";

describe("build-cards", () => {
  it("maps each link to the notes that use it, once per note", () => {
    const notes = [
      ["a.md", "[x](https://a.com) [y](https://a.com) [z](https://b.com)"],
      ["b.md", "[x](https://a.com)"],
    ];
    expect(notesByLink(notes)).toEqual(
      new Map([
        ["https://a.com", ["a.md", "b.md"]],
        ["https://b.com", ["a.md"]],
      ]),
    );
  });

  it.each([
    ["https://github.com/asemorales/bierstadt", { kind: "github", id: "asemorales/bierstadt" }],
    ["https://github.com/asemorales/bierstadt/issues", { kind: "page" }],
    ["https://arxiv.org/abs/1706.03762v5", { kind: "arxiv", id: "1706.03762" }],
    ["https://arxiv.org/pdf/1706.03762.pdf", { kind: "arxiv", id: "1706.03762" }],
    ["https://doi.org/10.1145/3663976.3664235", { kind: "doi", id: "10.1145/3663976.3664235" }],
    ["https://en.wikipedia.org/wiki/Halting_problem", { kind: "wikipedia", id: "Halting_problem", lang: "en" }],
    ["https://gwern.net/design", { kind: "page" }],
    ["https://consc.net/papers/emergence.PDF", { kind: "pdf" }],
  ])("classifies %s", (url, expected) => expect(classify(url)).toEqual(expected));

  it("reads an arXiv entry", () => {
    const xml = `<feed><entry><title>A  Title</title><published>2017-06-12T00:00:00Z</published><summary>Short &amp; sweet.</summary>
      <author><name>Grace B. Ada</name></author><author><name>B</name></author><author><name>C</name></author><author><name>D</name></author></entry></feed>`;
    expect(parseArxiv(xml)).toEqual({ title: "A Title", meta: ["Ada et al.", "2017", "arXiv"], text: "Short & sweet." });
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
    expect(parseCrossref(work)).toEqual({ title: "T", meta: ["Turing", "1937", "J"], text: "Text." });
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

  it.each([
    ["a named entity", "Web &ndash; guide", "Web – guide"],
    ["decimal and hex references", "it&#39;s &#x2014; ok", "it's — ok"],
    ["a non-breaking space", "a&nbsp;b", "a b"],
    ["double-escaped text only once", "&amp;lt;tag&amp;gt;", "&lt;tag&gt;"],
  ])("decodes %s in a page title", (_, title, expected) => {
    expect(parsePage(`<title>${title}</title>`).title).toBe(expected);
  });

  it("reads a page's first real paragraph, past short ones and page furniture", () => {
    const opening = "This opening paragraph is long enough to count, it&#x27;s <em>real</em>.";
    const html = `<title>T</title><nav><p>A navigation paragraph that is long enough to count as one.</p></nav><main><p>Menu</p><p>${opening}</p><p>A later paragraph that is also long enough to count.</p></main>`;
    expect(parsePage(html).text).toBe("This opening paragraph is long enough to count, it's real.");
  });
});
