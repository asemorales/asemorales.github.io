import { toHtml } from "hast-util-to-html";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { archived, rehypeDeadLinks } from "../../src/lib/dead-links.js";
import { rehypeGlossary } from "../../src/lib/glossary.js";
import { el, txt } from "../../src/lib/hast.js";
import { rehypeBibliography } from "../../src/lib/rehype-bibliography.js";
import { rehypeBlocks } from "../../src/lib/rehype-blocks.js";
import { rehypeInlineMarks } from "../../src/lib/rehype-inline-marks.js";
import { rehypeCallouts } from "../../src/lib/rehype-callouts.js";
import { rehypeFigures } from "../../src/lib/rehype-figures.js";
import { rehypeSections } from "../../src/lib/rehype-sections.js";
import { letter, rehypeSidenotes } from "../../src/lib/rehype-sidenotes.js";
import { remarkBlockIds } from "../../src/lib/remark-block-ids.js";
import { remarkHighlights } from "../../src/lib/remark-highlights.js";
import { linkTargets, remarkWikilinks } from "../../src/lib/wikilinks.js";

const root = (...children) => ({ type: "root", children });
const p = (...children) =>
  el(
    "p",
    {},
    children.map((c) => (typeof c === "string" ? txt(c) : c)),
  );
const quote = (...children) => el("blockquote", {}, children);

describe("rehypeGlossary", () => {
  const entry = () => root(el("h2", {}, [txt("foo (noun)")]), p("A foo."), el("h2", {}, [txt("bar (verb)")]), p("To bar."));

  it("sets the type apart and keeps the term's anchor", () => {
    const tree = entry();
    rehypeGlossary()(tree, { stem: "glossary" });
    expect(toHtml(tree)).toBe(
      '<h2>foo <span class="term-type">noun</span></h2><p>A foo.</p><h2>bar <span class="term-type">verb</span></h2><p>To bar.</p>',
    );
    rehypeSections()(tree, { stem: "glossary", data: {} });
    expect(tree.children.filter((n) => n.tagName === "h2").map((n) => n.properties.id)).toEqual(["foo-noun", "bar-verb"]);
  });

  it("does not change other notes", () => {
    const tree = entry();
    rehypeGlossary()(tree, { stem: "other" });
    expect(toHtml(tree)).toBe(toHtml(entry()));
  });
});

describe("rehypeCallouts", () => {
  it("keeps a block ID set on the quote", () => {
    const tree = root(el("blockquote", { id: "fig-1" }, [p("[!figure]\n", el("img", { src: "a.svg", alt: "A" }), "\nCaption.")]));
    rehypeCallouts()(tree);
    expect(tree.children[0].properties.id).toBe("fig-1");
  });

  it("turns [!status] into a box and drops the marker", () => {
    const tree = root(quote(p("[!status]\nDraft.")));
    rehypeCallouts()(tree);
    expect(toHtml(tree)).toBe('<aside class="status" aria-label="Status"><p>Draft.</p></aside>');
  });

  it("puts an attribution with inline markup in a footer", () => {
    const tree = root(quote(p("[!quote] Brooks, ", el("em", {}, [txt("Work")]), ", 1991\nText.")));
    rehypeCallouts()(tree);
    expect(toHtml(tree)).toBe("<blockquote><p>Text.</p><footer>Brooks, <em>Work</em>, 1991</footer></blockquote>");
  });

  it("keeps the title of any other type as the attribution", () => {
    const tree = root(quote(p("[!epigraph] Borges\nHexagons.")), quote(p("[!quote] Brooks\nGrounding.")));
    rehypeCallouts()(tree);
    expect(toHtml(tree)).toBe(
      "<blockquote><p>Hexagons.</p><footer>Borges</footer></blockquote><blockquote><p>Grounding.</p><footer>Brooks</footer></blockquote>",
    );
  });

  it("keeps a quote's line breaks, including inside formatting", () => {
    const tree = root(quote(p("[!quote] Shelley\nFirst\n", el("em", {}, [txt("second\nthird")]))));
    rehypeCallouts()(tree);
    expect(toHtml(tree)).toBe("<blockquote><p>First<br>\n<em>second<br>\nthird</em></p><footer>Shelley</footer></blockquote>");
  });

  it("keeps the line breaks of a quote without a callout marker", () => {
    const tree = root(quote(p("First\nsecond")));
    rehypeCallouts()(tree);
    expect(toHtml(tree)).toBe("<blockquote><p>First<br>\nsecond</p></blockquote>");
  });

  it("wraps a [!wide] callout's contents in a wide box", () => {
    const tree = root(quote(p("[!wide]"), el("table", {})));
    rehypeCallouts()(tree);
    expect(toHtml(tree)).toBe('<div class="wide"><table></table></div>');
  });

  it("captions a [!figure] callout's image with the text below it, keeping inline italics", () => {
    const img = el("img", { src: "a.svg", alt: "A" });
    const tree = root(quote(p("[!figure]\n", img, "\nSee ", el("em", {}, [txt("Title")]), ".")));
    rehypeCallouts()(tree);
    expect(toHtml(tree)).toBe('<figure><img src="a.svg" alt="A"><figcaption>See <em>Title</em>.</figcaption></figure>');
  });

  it("wraps a [!wide-figure] callout's figure in a wide box", () => {
    const img = el("img", { src: "a.svg", alt: "A" });
    const tree = root(quote(p("[!wide-figure]\n", img, "\nCaption.")));
    rehypeCallouts()(tree);
    expect(toHtml(tree)).toBe('<div class="wide"><figure><img src="a.svg" alt="A"><figcaption>Caption.</figcaption></figure></div>');
  });

  it("leaves a [!figure] callout without an image as a quote", () => {
    const tree = root(quote(p("[!figure]\nNo image.")));
    rehypeCallouts()(tree);
    expect(tree.children[0].tagName).toBe("blockquote");
  });
});

describe("rehypeFigures", () => {
  const img = el("img", { src: "a.svg", alt: "A" });

  it("makes a lone image a figure, with an italic line below as its caption", () => {
    const tree = root(p(img), p(img, "\n", el("em", {}, [txt("Caption.")])));
    rehypeFigures()(tree);
    expect(toHtml(tree)).toBe(
      '<figure><img src="a.svg" alt="A"></figure><figure><img src="a.svg" alt="A"><figcaption>Caption.</figcaption></figure>',
    );
  });

  it("does not change images in running text", () => {
    const tree = root(p("See ", img), p(img, el("em", {}, [txt("a")]), " b"));
    rehypeFigures()(tree);
    expect(tree.children.map((c) => c.tagName)).toEqual(["p", "p"]);
  });
});

describe("rehypeSidenotes", () => {
  const ref = (id, n, suffix = "") =>
    el("sup", {}, [el("a", { href: `#user-content-fn-${id}`, id: `user-content-fnref-${id}${suffix}`, dataFootnoteRef: true }, [txt(String(n))])]);
  const back = (id) => el("a", { href: `#user-content-fnref-${id}`, dataFootnoteBackref: true }, [txt("↩")]);
  const link = (href, label) => el("a", { href }, [txt(label)]);
  const footnotes = (...items) => el("section", { dataFootnotes: true, className: ["footnotes"] }, [el("ol", {}, items)]);
  const note = (id, ...children) => el("li", { id: `user-content-fn-${id}` }, [p(...children, back(id))]);

  it("moves each note beside its first reference, adds a letter, and links later references back", () => {
    const tree = root(p("One.", ref("a", 1)), p("Two.", ref("a", 1, "-2")), footnotes(note("a", "Note A. ")));
    const file = { data: {} };
    rehypeSidenotes()(tree, file);
    expect(tree.children).toHaveLength(2);
    expect(toHtml(tree.children[0])).toBe(
      '<p>One.<label for="sn-a" id="snref-a" class="sidenote-number"><span class="sr-only">Note </span>[a]</label>' +
        '<input type="checkbox" id="sn-a" class="margin-toggle">' +
        '<span class="sidenote" role="note"><span class="sidenote-mark" aria-hidden="true">a</span> <span class="sidenote-block">Note A.</span></span></p>',
    );
    expect(toHtml(tree.children[1])).toBe('<p>Two.<sup class="sidenote-ref"><a href="#snref-a" aria-label="Note a">[a]</a></sup></p>');
    expect(file.data.citations).toEqual([]);
  });

  it("numbers cite- footnotes as citations, reusing a source's number", () => {
    const tree = root(
      p("One.", ref("cite-s", 1), " Two.", ref("n", 2), " Three.", ref("cite-t", 3)),
      footnotes(
        note("cite-s", link("https://smith.org", "Smith 2010"), ", p. 45."),
        note("n", "A note citing Smith.", ref("cite-s2", 4)),
        note("cite-t", link("https://tao.org", "Tao")),
        note("cite-s2", link("https://smith.org", "Smith 2010"), ", p. 50"),
      ),
    );
    const file = { data: {} };
    rehypeSidenotes()(tree, file);
    const html = toHtml(tree);
    expect(html).toContain('<sup class="cite-ref" id="cite-ref-1-1"><a href="#ref-1" aria-label="Reference 1">[1]</a></sup>');
    expect(html).toContain('<sup class="cite-ref" id="cite-ref-1-2"><a href="#ref-1" aria-label="Reference 1">[1]</a></sup>');
    expect(html).toContain('<a href="#ref-2" aria-label="Reference 2">[2]</a>');
    expect(html).toContain("[a]</label>");
    expect(file.data.citations).toEqual([
      { url: "https://smith.org", text: "Smith 2010", n: 1, locators: ["p. 45", "p. 50"], refs: ["cite-ref-1-1", "cite-ref-1-2"] },
      { url: "https://tao.org", text: "Tao", n: 2, locators: [], refs: ["cite-ref-2-1"] },
    ]);
  });

  it("keeps a locator's formatting and spacing, and escapes its text", () => {
    const em = (value) => el("em", {}, [txt(value)]);
    const tree = root(
      p("One.", ref("cite-a", 1)),
      footnotes(note("cite-a", link("https://smith.org", "Smith 2010"), ", ", em("A & B"), " ", el("strong", {}, [em("C")]), ", p. 3.", " ")),
    );
    const file = { data: {} };
    rehypeSidenotes()(tree, file);
    expect(file.data.citations[0].locators).toEqual(["<em>A &#x26; B</em> <strong><em>C</em></strong>, p. 3"]);
  });

  it("keeps a footnote that is only a link as a sidenote without the cite- prefix", () => {
    const tree = root(p("One.", ref("a", 1)), footnotes(note("a", link("https://smith.org", "Smith 2010"))));
    const file = { data: {} };
    rehypeSidenotes()(tree, file);
    expect(toHtml(tree)).toContain('class="sidenote"');
    expect(file.data.citations).toEqual([]);
  });

  it("numbers a cite- footnote without a link by its text, keeping its formatting", () => {
    const em = (value) => el("em", {}, [txt(value)]);
    const cite = (id) => note(id, "Smith, 2010, ", em("Title"), ".");
    const tree = root(
      p("One.", ref("cite-a", 1), ref("cite-b", 2), ref("cite-c", 3)),
      footnotes(cite("cite-a"), cite("cite-b"), note("cite-c", "Tao")),
    );
    const file = { data: {} };
    rehypeSidenotes()(tree, file);
    expect(file.data.citations).toEqual([
      { text: "Smith, 2010, <em>Title</em>", n: 1, locators: [], refs: ["cite-ref-1-1", "cite-ref-1-2"] },
      { text: "Tao", n: 2, locators: [], refs: ["cite-ref-2-1"] },
    ]);
  });

  it.each([
    ["starts with text", ["See ", link("https://smith.org", "Smith 2010")]],
    ["links internally", [link("/smith/", "Smith 2010")]],
    ["has a second link", [link("https://smith.org", "Smith"), " and ", link("https://tao.org", "Tao")]],
    ["nests a link in its locator", [link("https://smith.org", "Smith 2010"), ", ", el("em", {}, [link("https://tao.org", "Tao")])]],
  ])("fails the build when a cite- footnote %s", (_, children) => {
    const tree = root(p("One.", ref("cite-a", 1)), footnotes(note("cite-a", ...children)));
    expect(() => rehypeSidenotes()(tree, { data: {}, path: "note.md" })).toThrow("note.md: footnote [^cite-a]");
  });

  it("renders a quote callout with spans, since a sidenote sits inside a paragraph", () => {
    const callout = quote(p("[!quote] Fuller\nA verb."));
    const tree = root(p("One.", ref("a", 1)), footnotes(el("li", { id: "user-content-fn-a" }, [callout])));
    rehypeCallouts()(tree);
    rehypeSidenotes()(tree, { data: {} });
    expect(toHtml(tree)).toContain(
      '<span class="sidenote-block sidenote-quote"><span class="sidenote-block">A verb.</span>' +
        '<span class="sidenote-block sidenote-attribution">Fuller</span></span>',
    );
    expect(toHtml(tree)).not.toMatch(/<footer|<blockquote/);
  });

  it("renders a status callout with spans", () => {
    const tree = root(p("One.", ref("s", 1)), footnotes(el("li", { id: "user-content-fn-s" }, [quote(p("[!status]\nDraft."))])));
    rehypeCallouts()(tree);
    rehypeSidenotes()(tree, { data: {} });
    const html = toHtml(tree);
    expect(html).toContain(
      '<span class="sidenote-block sidenote-status" role="group" aria-label="Status"><span class="sidenote-block">Draft.</span></span>',
    );
    expect(html).not.toMatch(/<aside/);
  });

  it("renders a definition callout with spans, keeping its term, sections, and list items apart", () => {
    const callout = quote(
      p("[!definition] foo (noun)\nA foo."),
      el("h3", {}, [txt("Examples")]),
      el("ul", {}, [el("li", {}, [txt("one")]), el("li", {}, [txt("two")])]),
    );
    const tree = root(p("One.", ref("d", 1)), footnotes(el("li", { id: "user-content-fn-d" }, [callout])));
    rehypeCallouts()(tree);
    rehypeSidenotes()(tree, { data: {} });
    const html = toHtml(tree);
    expect(html).toContain(
      '<span class="sidenote-block sidenote-definition" role="group" aria-label="Definition">' +
        '<span class="sidenote-block sidenote-title">foo <span class="term-type">noun</span></span>' +
        '<span class="sidenote-block">A foo.</span>' +
        '<span class="sidenote-block definition-label">Examples</span>' +
        '<span class="sidenote-block sidenote-list"><span class="sidenote-block">one</span><span class="sidenote-block">two</span></span></span>',
    );
    expect(html).not.toMatch(/<div|<h3|<ul/);
  });

  it("renders an attributed quote inside a definition callout, in the column and in a sidenote", () => {
    const definition = () => quote(p("[!definition]\nA foo."), quote(p("[!quote] Smith\nQuoted.")));
    const column = root(definition());
    rehypeCallouts()(column);
    expect(toHtml(column)).toBe(
      '<div class="definition" role="group" aria-label="Definition"><p>A foo.</p><blockquote><p>Quoted.</p><footer>Smith</footer></blockquote></div>',
    );

    const tree = root(p("One.", ref("d", 1)), footnotes(el("li", { id: "user-content-fn-d" }, [definition()])));
    rehypeCallouts()(tree);
    rehypeSidenotes()(tree, { data: {} });
    expect(toHtml(tree)).toContain(
      '<span class="sidenote-block sidenote-quote"><span class="sidenote-block">Quoted.</span><span class="sidenote-block sidenote-attribution">Smith</span></span>',
    );
  });

  it("labels notes past z as aa, ab", () => {
    expect([0, 25, 26, 27, 701, 702].map(letter)).toEqual(["a", "z", "aa", "ab", "zz", "aaa"]);
  });
});

describe("rehypeSections", () => {
  it("links each heading to itself, and lifts the contents out of the note body", () => {
    const tree = root(p("Opening."), el("h2", {}, [txt("One")]), el("h3", {}, [txt("Sub")]), el("h2", {}, [txt("Two")]));
    const file = { data: { astro: { frontmatter: {} } } };
    rehypeSections()(tree, file);
    const [, h2] = tree.children;
    expect(tree.children.some((n) => n.tagName === "nav")).toBe(false);
    expect(toHtml(h2)).toBe(
      '<h2 id="one">One<a href="#one" class="anchor" aria-label="Link to section One"><span class="icon icon-link" aria-hidden="true"></span></a></h2>',
    );
    expect(file.data.astro.frontmatter.toc).toContain('<li><a href="#one">One</a><ol><li><a href="#sub">Sub</a></li></ol></li>');
  });

  it("ends the contents with See also, References, and External links when the note has them", () => {
    const tree = root(el("h2", {}, [txt("Only")]));
    const file = {
      stem: "here",
      data: { astro: { frontmatter: { references: [{ url: "https://a.org" }], externalLinks: [{ url: "https://b.org" }] } } },
    };
    rehypeSections({ seeAlso: ["here"] })(tree, file);
    expect(file.data.astro.frontmatter.toc).toContain(
      '<li><a href="#only">Only</a></li><li><a href="#see-also">See also</a></li><li><a href="#references">References</a></li><li><a href="#external-links">External links</a></li>',
    );
  });

  it("gives a heading named like the back matter a numbered id", () => {
    const tree = root(el("h2", {}, [txt("External links")]));
    rehypeSections()(tree);
    expect(tree.children[0].properties.id).toBe("external-links-1");
  });

  it("adds no contents for a single heading", () => {
    const file = { data: { astro: { frontmatter: {} } } };
    rehypeSections()(root(el("h2", {}, [txt("Only")])), file);
    expect(file.data.astro.frontmatter.toc).toBeUndefined();
  });
});

describe("rehypeBlocks", () => {
  it("wraps code and display math, moving the TeX to the wrapper", () => {
    const tree = root(el("pre", { class: "astro-code" }), el("mjx-container", { display: "true", dataTex: "x^2" }));
    rehypeBlocks()(tree);
    expect(toHtml(tree)).toBe(
      '<div class="code-block"><pre class="astro-code"></pre></div><div class="math-block" data-tex="x^2"><mjx-container display="true"></mjx-container></div>',
    );
  });

  it.each([
    ["a bold sentence before more text", ["Lead.", " Body."], true],
    ["a bold sentence alone", ["Lead!"], true],
    ["a closing quote after the stop", ["“Lead?”", " Body."], true],
    ["bold that stops mid-sentence", ["Lead", " continues."], false],
    ["a stop followed by more of the sentence", ["Lead.", ", he said."], false],
  ])("handles %s", (_, [bold, ...rest], marked) => {
    const lead = el("strong", {}, [txt(bold)]);
    rehypeInlineMarks()(root(p(lead, ...rest)));
    expect(lead.properties.className).toEqual(marked ? ["lead-in"] : undefined);
  });

  it("does not change bold later in a paragraph", () => {
    const later = el("strong", {}, [txt("Later.")]);
    rehypeBlocks()(root(p("Opening. ", later)));
    expect(later.properties.className).toBeUndefined();
  });
});

describe("rehypeBibliography", () => {
  const a = (href) => el("a", { href }, [txt(href)]);

  it("lists external links in order, with an id for each appearance", () => {
    const tree = root(p(a("https://b.org"), a("#local"), a("https://a.org"), a("https://b.org")));
    const file = { data: {} };
    rehypeBibliography()(tree, file);
    expect(file.data.astro.frontmatter.references).toEqual([]);
    expect(file.data.astro.frontmatter.externalLinks).toEqual([
      { url: "https://b.org", text: "https://b.org", refs: ["link-1-1", "link-1-2"] },
      { url: "https://a.org", text: "https://a.org", refs: ["link-2-1"] },
    ]);
  });

  it("keeps a cited URL under References only, counting its prose links as citations", () => {
    const tree = root(p(a("https://cited.org"), a("https://other.org")));
    const citations = [{ url: "https://cited.org", text: "Cited", n: 1, locators: [], refs: ["cite-ref-1-1"] }];
    const file = { data: { citations } };
    rehypeBibliography()(tree, file);
    expect(file.data.astro.frontmatter.references).toEqual([{ ...citations[0], refs: ["cite-ref-1-1", "cite-ref-1-2"] }]);
    expect(file.data.astro.frontmatter.externalLinks.map((l) => l.url)).toEqual(["https://other.org"]);
    expect(citations[0].refs).toEqual(["cite-ref-1-1"]);
  });

  it("keeps every citation without a URL under References", () => {
    const citations = [
      { text: "A", n: 1, locators: [], refs: ["cite-ref-1-1"] },
      { text: "B", n: 2, locators: [], refs: ["cite-ref-2-1"] },
    ];
    const file = { data: { citations } };
    rehypeBibliography()(root(p()), file);
    expect(file.data.astro.frontmatter.references).toEqual(citations);
  });
});

describe("wikilinks", () => {
  const run = (value) => {
    const tree = { type: "root", children: [{ type: "paragraph", children: [{ type: "text", value }] }] };
    remarkWikilinks({ slugs: ["here", "rices-theorem"] })(tree);
    return tree.children[0].children;
  };

  it("links published notes and headings, and leaves others as text", () => {
    expect(run("See [[Rices-Theorem#Proof sketch|the proof]] and [[Secret]].")).toEqual([
      { type: "text", value: "See " },
      { type: "link", url: "/rices-theorem/#proof-sketch", children: [{ type: "text", value: "the proof" }] },
      { type: "text", value: " and " },
      { type: "text", value: "Secret" },
      { type: "text", value: "." },
    ]);
  });

  it("links headings with no target by anchor alone", () => {
    expect(
      run("[[#Math]] [[here#Code]]")
        .filter((n) => n.type === "link")
        .map((n) => n.url),
    ).toEqual(["#math", "/here/#code"]);
  });

  it("links headings named like the back matter to their rehypeSections ids", () => {
    expect(
      run("[[#References]] [[#External links]] [[#See also]]")
        .filter((n) => n.type === "link")
        .map((n) => n.url),
    ).toEqual(["#references-1", "#external-links-1", "#see-also-1"]);
  });

  it("links block IDs to the ids remarkBlockIds sets", () => {
    expect(run("[[#^def-3-1|Definition 3.1]]")[0].url).toBe("#def-3-1");
  });

  it("lists link targets outside code", () => {
    expect(linkTargets("[[A]] [[B#x|y]] [[#Self]] `[[C]]`\n```\n[[D]]\n```\n![[img.png]]")).toEqual(["a", "b"]);
  });
});

describe("rehypeDeadLinks", () => {
  const status = {
    "https://gone.org/page": { firstSeen: "2026-01-02", failures: 2, deadSince: "2026-03-04" },
    "https://flaky.org": { firstSeen: "2026-01-02", failures: 1 },
  };

  it("points dead links at the Wayback Machine, dated when first seen", () => {
    const tree = root(p(el("a", { href: "https://gone.org/page" }, [txt("Gone")]), el("a", { href: "https://flaky.org" }, [txt("Flaky")])));
    rehypeDeadLinks({ status })(tree);
    expect(toHtml(tree)).toBe(
      '<p><a href="https://web.archive.org/web/20260102/https://gone.org/page" class="dead" data-dead-since="2026-03-04">Gone</a><a href="https://flaky.org">Flaky</a></p>',
    );
  });

  it("finds no archived copy for live or unknown links", () => {
    expect(archived("https://flaky.org", status)).toBeNull();
    expect(archived("https://new.org", status)).toBeNull();
  });
});

const markdown = (md) =>
  String(unified().use(remarkParse).use(remarkHighlights).use(remarkBlockIds).use(remarkRehype).use(rehypeStringify).processSync(md)).replace(
    /\n/g,
    "",
  );

describe("remarkHighlights", () => {
  it("marks text between == pairs, across inline markup", () => {
    expect(markdown("a ==b *c* d== e ==f==")).toBe("<p>a <mark>b <em>c</em> d</mark> e <mark>f</mark></p>");
  });

  it("keeps an unpaired == and code as text", () => {
    expect(markdown("a == b `==c==`")).toBe("<p>a == b <code>==c==</code></p>");
  });
});

describe("remarkBlockIds", () => {
  it("moves a trailing ^id onto its paragraph or list item", () => {
    expect(markdown("Text. ^Def-1\n\n1. Item ^item-1\n2. Other")).toBe('<p id="def-1">Text.</p><ol><li id="item-1">Item</li><li>Other</li></ol>');
  });

  it("gives a ^id on its own line to the block above", () => {
    expect(markdown("- a\n- b\n\n^list")).toBe('<ul id="list"><li>a</li><li>b</li></ul>');
  });
});
