import { createHash } from "node:crypto";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { STATE } from "mathjax-full/js/core/MathItem.js";
import { SerializedMmlVisitor } from "mathjax-full/js/core/MmlTree/SerializedMmlVisitor.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";
import { mathjax } from "mathjax-full/js/mathjax.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { COLORS } from "./site.js";

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const PACKAGES = AllPackages.filter((p) => p !== "bussproofs");
const mmlDoc = mathjax.document("", { InputJax: new TeX({ packages: PACKAGES, tags: "ams" }) });
const svgDoc = mathjax.document("", { InputJax: new TeX({ packages: AllPackages }), OutputJax: new SVG({ fontCache: "local" }) });
const inlineDoc = mathjax.document("", { InputJax: new TeX({ packages: PACKAGES }), OutputJax: new SVG({ fontCache: "none" }) });
const visitor = new SerializedMmlVisitor();

export function resetMathTags() {
  mmlDoc.inputJax[0].parseOptions.tags.reset();
}

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
  return svg.replace("<svg ", `<svg ${xmlns}color="${COLORS.lightInk}" `).replace('style="', 'style="background: white; ');
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
