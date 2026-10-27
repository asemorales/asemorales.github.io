import { createHash } from "node:crypto";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { STATE } from "mathjax-full/js/core/MathItem.js";
import { SerializedMmlVisitor } from "mathjax-full/js/core/MmlTree/SerializedMmlVisitor.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";
import { mathjax } from "mathjax-full/js/mathjax.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { rehypeDeadLinks } from "./dead-links.js";
import { classes, el, isElement, text, txt, walk } from "./hast.js";
import { rehypeCallouts } from "./rehype-callouts.js";
import { rehypeFigures } from "./rehype-figures.js";
import { remarkWikilinks } from "./wikilinks.js";

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const PACKAGES = AllPackages.filter((p) => p !== "bussproofs");
const mmlDoc = mathjax.document("", { InputJax: new TeX({ packages: PACKAGES, tags: "ams" }) });
const svgDoc = mathjax.document("", { InputJax: new TeX({ packages: AllPackages }), OutputJax: new SVG({ fontCache: "local" }) });
const inlineDoc = mathjax.document("", { InputJax: new TeX({ packages: PACKAGES }), OutputJax: new SVG({ fontCache: "none" }) });
const visitor = new SerializedMmlVisitor();

const INK = "#231a15";

export const isProofTree = (tex) => /\\begin\{prooftree\}/.test(tex);

export function mathImageName(tex) {
  return `${createHash("sha256").update(tex).digest("hex").slice(0, 16)}.svg`;
}

export function texToMathml(tex, display) {
  return visitor.visitTree(mmlDoc.convert(tex, { display, end: STATE.CONVERT }));
}

export function texToSvg(tex) {
  const svg = adaptor.innerHTML(svgDoc.convert(tex, { display: true }));
  const xmlns = svg.includes("xmlns=") ? "" : 'xmlns="http://www.w3.org/2000/svg" ';
  return svg.replace("<svg ", `<svg ${xmlns}color="${INK}" `);
}

export function texToInlineSvg(tex) {
  const node = inlineDoc.convert(tex, { display: false });
  const svg = adaptor.firstChild(node);
  adaptor.setAttribute(svg, "aria-label", tex);
  return adaptor.outerHTML(node);
}

export function proofTrees(markdown) {
  const out = [];
  const tree = unified().use(remarkParse).use(remarkMath).parse(markdown);
  const visit = (node) => {
    if (node.type === "math" && isProofTree(node.value)) out.push(node.value);
    node.children?.forEach(visit);
  };
  visit(tree);
  return out;
}

function rehypeFeedMath({ site }) {
  return (tree) => {
    mmlDoc.inputJax[0].parseOptions.tags.reset();
    walk(tree, (node, parent) => {
      const display = isElement(node, "pre") && node.children.some((c) => isElement(c, "code") && classes(c).includes("math-display"));
      const inline = isElement(node, "code") && classes(node).includes("math-inline");
      if (!display && !inline) return false;
      const tex = text(node).trim();
      const i = parent.children.indexOf(node);
      if (display && isProofTree(tex)) {
        parent.children[i] = el("p", {}, [el("img", { src: `${site}/feed/math/${mathImageName(tex)}`, alt: tex })]);
      } else {
        parent.children[i] = { type: "raw", value: texToMathml(tex, display) };
      }
      return true;
    });
  };
}

function rehypeFeedTidy({ site, base, image }) {
  return (tree) => {
    const tidy = (node) => {
      if (!node.children) return;
      node.children = node.children.flatMap((child) => {
        if (!isElement(child)) return [child];
        tidy(child);
        if (isElement(child, "aside")) return [el("blockquote", {}, child.children)];
        if (isElement(child, "div") && classes(child).includes("wide")) return child.children;
        delete child.properties.className;
        delete child.properties.ariaLabel;
        delete child.properties.dataDeadSince;
        for (const attr of ["href", "src"]) {
          const v = child.properties[attr];
          if (typeof v !== "string") continue;
          if (attr === "src" && v.startsWith("./")) child.properties.src = new URL(image(v), site).href;
          else if (v.startsWith("#")) child.properties[attr] = `${base}${v}`;
          else if (v.startsWith("/")) child.properties[attr] = `${site}${v}`;
        }
        return [child];
      });
    };
    tidy(tree);
  };
}

function rehypeFeedFootnotes() {
  return (tree) => {
    walk(tree, (node) => {
      if (!isElement(node, "h2") || node.properties.id !== "footnote-label") return false;
      node.children = [txt("Notes")];
      return true;
    });
  };
}

export async function feedHtml(markdown, { title, slug, titles, site, status = {}, image = (src) => src }) {
  const base = `${site}/${slug}/`;
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkWikilinks, { titles })
    .use(remarkRehype)
    .use(rehypeFeedMath, { site })
    .use(rehypeCallouts)
    .use(rehypeFigures)
    .use(rehypeFeedFootnotes)
    .use(rehypeDeadLinks, { status })
    .use(rehypeFeedTidy, { site, base, image })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process({ value: markdown, data: { astro: { frontmatter: { title } } } });
  return String(file);
}
