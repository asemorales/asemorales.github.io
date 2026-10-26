import { toHtml } from "hast-util-to-html";
import { describe, expect, it } from "vitest";
import { el, txt } from "../../src/lib/hast.js";
import { rehypeBibliography } from "../../src/lib/rehype-bibliography.js";
import { rehypeBlocks } from "../../src/lib/rehype-blocks.js";
import { rehypeCallouts } from "../../src/lib/rehype-callouts.js";
import { rehypeFigures } from "../../src/lib/rehype-figures.js";
import { rehypeSections } from "../../src/lib/rehype-sections.js";
import { rehypeSidenotes } from "../../src/lib/rehype-sidenotes.js";
import { linkTargets, remarkWikilinks } from "../../src/lib/wikilinks.js";

const root = (...children) => ({ type: "root", children });
const p = (...children) =>
  el(
    "p",
    {},
    children.map((c) => (typeof c === "string" ? txt(c) : c)),
  );
const quote = (...children) => el("blockquote", {}, children);

describe("rehypeCallouts", () => {
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

  it("turns an infobox's key-value list into a description list", () => {
    const li = (k, v) => el("li", {}, [el("strong", {}, [txt(`${k}:`)]), txt(` ${v}`)]);
    const tree = root(quote(p("[!infobox] NP"), el("ul", {}, [li("Contains", "P")])));
    rehypeCallouts()(tree);
    expect(toHtml(tree)).toBe('<aside class="infobox" aria-label="NP"><p class="callout-title">NP</p><dl><dt>Contains</dt><dd>P</dd></dl></aside>');
  });

  it("wraps a [!wide] callout's contents in a wide box", () => {
    const tree = root(quote(p("[!wide]"), el("table", {})));
    rehypeCallouts()(tree);
    expect(toHtml(tree)).toBe('<div class="wide"><table></table></div>');
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

  it("leaves images in running text alone", () => {
    const tree = root(p("See ", img), p(img, el("em", {}, [txt("a")]), " b"));
    rehypeFigures()(tree);
    expect(tree.children.map((c) => c.tagName)).toEqual(["p", "p"]);
  });
});

describe("rehypeSidenotes", () => {
  const ref = (id, n, suffix = "") =>
    el("sup", {}, [el("a", { href: `#user-content-fn-${id}`, id: `user-content-fnref-${id}${suffix}`, dataFootnoteRef: true }, [txt(String(n))])]);
  const footnotes = el("section", { dataFootnotes: true, className: ["footnotes"] }, [
    el("ol", {}, [
      el("li", { id: "user-content-fn-a" }, [p("Note A. ", el("a", { href: "#user-content-fnref-a", dataFootnoteBackref: true }, [txt("↩")]))]),
    ]),
  ]);

  it("moves each note beside its first reference and links later ones back", () => {
    const tree = root(p("One.", ref("a", 1)), p("Two.", ref("a", 1, "-2")), footnotes);
    rehypeSidenotes()(tree);
    expect(tree.children).toHaveLength(2);
    expect(toHtml(tree.children[0])).toBe(
      '<p>One.<label for="sn-a" id="snref-a" class="sidenote-number"><span class="sr-only">Sidenote </span>1</label>' +
        '<input type="checkbox" id="sn-a" class="margin-toggle">' +
        '<span class="sidenote" role="note"><span class="sidenote-mark" aria-hidden="true">1</span> <span class="sidenote-block">Note A.</span></span></p>',
    );
    expect(toHtml(tree.children[1])).toBe('<p>Two.<sup class="sidenote-ref"><a href="#snref-a" aria-label="Sidenote 1">1</a></sup></p>');
  });
});

describe("rehypeSections", () => {
  it("numbers headings, links each to itself, and adds contents before the first", () => {
    const tree = root(p("Opening."), el("h2", {}, [txt("One")]), el("h3", {}, [txt("Sub")]), el("h2", {}, [txt("Two")]));
    rehypeSections()(tree);
    const [, toc, h2] = tree.children;
    expect(toc.tagName).toBe("nav");
    expect(toHtml(h2)).toBe(
      '<h2 id="one"><span class="secno">1.</span> One<a href="#one" class="anchor" aria-label="Link to section 1"><span class="icon icon-link" aria-hidden="true"></span></a></h2>',
    );
    expect(tree.children[3].children[0].children[0].value).toBe("1.1.");
    expect(tree.children[4].children[0].children[0].value).toBe("2.");
    expect(toHtml(toc)).toContain(
      '<li><a href="#one"><span class="secno">1.</span> One</a><ol><li><a href="#sub"><span class="secno">1.1.</span> Sub</a></li></ol></li>',
    );
  });

  it("ends the contents with See also and Bibliography, unnumbered, when the note has them", () => {
    const tree = root(el("h2", {}, [txt("Only")]));
    const file = { data: { astro: { frontmatter: { title: "Here", bibliography: [{ url: "https://a.org" }] } } } };
    rehypeSections({ backlinked: ["here"] })(tree, file);
    expect(toHtml(tree.children[0])).toContain(
      '<li><a href="#only"><span class="secno">1.</span> Only</a></li><li><a href="#see-also">See also</a></li><li><a href="#bibliography">Bibliography</a></li>',
    );
  });

  it("adds no contents for a single heading", () => {
    const tree = root(el("h2", {}, [txt("Only")]));
    rehypeSections()(tree);
    expect(tree.children).toHaveLength(1);
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
});

describe("rehypeBibliography", () => {
  it("lists external links in order, with an id for each citation", () => {
    const a = (href) => el("a", { href }, [txt(href)]);
    const tree = root(p(a("https://b.org"), a("#local"), a("https://a.org"), a("https://b.org")));
    const file = { data: {} };
    rehypeBibliography()(tree, file);
    expect(file.data.astro.frontmatter.bibliography).toEqual([
      { url: "https://b.org", text: "https://b.org", refs: ["cite-1-1", "cite-1-2"] },
      { url: "https://a.org", text: "https://a.org", refs: ["cite-2-1"] },
    ]);
  });
});

describe("wikilinks", () => {
  const run = (value, title = "Here") => {
    const tree = { type: "root", children: [{ type: "paragraph", children: [{ type: "text", value }] }] };
    remarkWikilinks({ titles: ["Here", "Rice's Theorem"] })(tree, { data: { astro: { frontmatter: { title } } } });
    return tree.children[0].children;
  };

  it("links published notes and headings, and leaves others as text", () => {
    expect(run("See [[Rice’s Theorem#Proof sketch|the proof]] and [[Secret]].")).toEqual([
      { type: "text", value: "See " },
      { type: "link", url: "/rices-theorem/#proof-sketch", children: [{ type: "text", value: "the proof" }] },
      { type: "text", value: " and " },
      { type: "text", value: "Secret" },
      { type: "text", value: "." },
    ]);
  });

  it("links headings in the same note by anchor alone", () => {
    expect(
      run("[[#Math]] [[Here#Code]]")
        .filter((n) => n.type === "link")
        .map((n) => n.url),
    ).toEqual(["#math", "#code"]);
  });

  it("lists link targets outside code", () => {
    expect(linkTargets("[[A]] [[B#x|y]] [[#Self]] `[[C]]`\n```\n[[D]]\n```\n![[img.png]]")).toEqual(["A", "B"]);
  });
});
