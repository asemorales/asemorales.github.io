import { describe, expect, it } from "vitest";
import { feedHtml } from "../../src/lib/feed.js";
import { mathImageName, proofTrees, texToSvg } from "../../src/lib/math.js";

const site = "https://asemorales.com";
const render = (md, opts = {}) => feedHtml(md, { slug: "here", slugs: ["here", "there"], site, ...opts });

describe("feed HTML", () => {
  it("keeps ordinary footnotes, with no sidenotes or contents", async () => {
    const html = await render("Text.[^a]\n\n## Part\n\nMore.\n\n[^a]: A note.");
    expect(html).toContain("<section data-footnotes>");
    expect(html).toContain("<h2>Part</h2>");
    expect(html).not.toMatch(/sidenote|toc/);
  });

  it("drops links to footnote anchors that exist only in the entry", async () => {
    const html = await render("Text.[^a]\n\n[^a]: A note.");
    expect(html).toContain("<sup>1</sup>");
    expect(html).not.toContain("user-content");
  });

  it("keeps a footnote quote's unindented lines in the footnote", async () => {
    const html = await render("Text.[^a]\n\n[^a]: > [!quote] Fuller\n> A verb.\n\nAfter.\n\n[^b]: > Note.\n\n> Separate.");
    const [body, notes] = html.split("<section data-footnotes>");
    expect(notes).toContain("A verb.");
    expect(body).not.toContain("A verb.");
    expect(body).toContain("Separate.");
  });

  it("keeps a quote's indentation and repeated spaces", async () => {
    const html = await render("> [!quote] Poet\n> One\n>     two   three\n>   *four*\n\nText.[^a]\n\n[^a]: > Five\n    >  six");
    expect(html).toContain("<p>One<br>\n\u00a0\u00a0\u00a0\u00a0two\u00a0\u00a0 three<br>\n\u00a0\u00a0<em>four</em></p>");
    expect(html).toContain("<p>Five<br>\n\u00a0six</p>");
  });

  it("writes math as MathML, and proof trees as images with their TeX", async () => {
    const tree = "\\begin{prooftree}\\AxiomC{A}\\UnaryInfC{B}\\end{prooftree}";
    const html = await render(`Let $x^2$ be.\n\n$$\n${tree}\n$$`);
    expect(html).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML">');
    expect(html).toContain(`<img src="${site}/feed/math/${mathImageName(tree)}" alt="${tree.replace(/\\/g, "\\")}">`);
    expect(proofTrees(`$$\n${tree}\n$$\n\n$$\nx\n$$`)).toEqual([tree]);
    const svg = texToSvg(tree);
    expect(svg).toMatch(/^<svg color="#231a15" /);
    expect(svg.match(/xmlns="http:\/\/www.w3.org\/2000\/svg"/g)).toHaveLength(1);
  });

  it("makes links absolute, resolves wikilinks, and archives dead links", async () => {
    const status = { "https://gone.org": { firstSeen: "2026-01-02", failures: 2, deadSince: "2026-02-03" } };
    const html = await render("[[there|There]], [[#Part]], [gone](https://gone.org), ![x](./images/a.svg)", {
      status,
      image: () => "/_astro/a.123.svg",
    });
    expect(html).toContain(`<a href="${site}/there/">There</a>`);
    expect(html).toContain(`<a href="${site}/here/#part">Part</a>`);
    expect(html).toContain('<a href="https://web.archive.org/web/20260102/https://gone.org">gone</a>');
    expect(html).toContain(`<img src="${site}/_astro/a.123.svg" alt="x">`);
  });

  it("turns callouts into plain quotes", async () => {
    const html = await render("> [!status]\n> Draft.\n\n> [!quote] Brooks, 1991\n> Grounding.");
    expect(html).toContain("<blockquote><p>Draft.</p></blockquote>");
    expect(html).toContain("<blockquote><p>Grounding.</p><footer>Brooks, 1991</footer></blockquote>");
    expect(html).not.toContain("class=");
  });
});
