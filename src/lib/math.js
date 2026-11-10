import { createHash } from "node:crypto";
import { liteAdaptor } from "@mathjax/src/js/adaptors/liteAdaptor.js";
import { STATE } from "@mathjax/src/js/core/MathItem.js";
import { SerializedMmlVisitor } from "@mathjax/src/js/core/MmlTree/SerializedMmlVisitor.js";
import { RegisterHTMLHandler } from "@mathjax/src/js/handlers/html.js";
import { TeX } from "@mathjax/src/js/input/tex.js";
import "@mathjax/src/js/input/tex/action/ActionConfiguration.js";
import "@mathjax/src/js/input/tex/ams/AmsConfiguration.js";
import "@mathjax/src/js/input/tex/amscd/AmsCdConfiguration.js";
import "@mathjax/src/js/input/tex/base/BaseConfiguration.js";
import "@mathjax/src/js/input/tex/bbox/BboxConfiguration.js";
import "@mathjax/src/js/input/tex/boldsymbol/BoldsymbolConfiguration.js";
import "@mathjax/src/js/input/tex/braket/BraketConfiguration.js";
import "@mathjax/src/js/input/tex/bussproofs/BussproofsConfiguration.js";
import "@mathjax/src/js/input/tex/cancel/CancelConfiguration.js";
import "@mathjax/src/js/input/tex/cases/CasesConfiguration.js";
import "@mathjax/src/js/input/tex/centernot/CenternotConfiguration.js";
import "@mathjax/src/js/input/tex/color/ColorConfiguration.js";
import "@mathjax/src/js/input/tex/colortbl/ColortblConfiguration.js";
import "@mathjax/src/js/input/tex/configmacros/ConfigMacrosConfiguration.js";
import "@mathjax/src/js/input/tex/empheq/EmpheqConfiguration.js";
import "@mathjax/src/js/input/tex/enclose/EncloseConfiguration.js";
import "@mathjax/src/js/input/tex/extpfeil/ExtpfeilConfiguration.js";
import "@mathjax/src/js/input/tex/gensymb/GensymbConfiguration.js";
import "@mathjax/src/js/input/tex/html/HtmlConfiguration.js";
import "@mathjax/src/js/input/tex/mathtools/MathtoolsConfiguration.js";
import "@mathjax/src/js/input/tex/mhchem/MhchemConfiguration.js";
import "@mathjax/src/js/input/tex/newcommand/NewcommandConfiguration.js";
import "@mathjax/src/js/input/tex/noerrors/NoErrorsConfiguration.js";
import "@mathjax/src/js/input/tex/noundefined/NoUndefinedConfiguration.js";
import "@mathjax/src/js/input/tex/tagformat/TagFormatConfiguration.js";
import "@mathjax/src/js/input/tex/textcomp/TextcompConfiguration.js";
import "@mathjax/src/js/input/tex/textmacros/TextMacrosConfiguration.js";
import "@mathjax/src/js/input/tex/unicode/UnicodeConfiguration.js";
import "@mathjax/src/js/input/tex/upgreek/UpgreekConfiguration.js";
import "@mathjax/src/js/input/tex/verb/VerbConfiguration.js";
import { mathjax } from "@mathjax/src/js/mathjax.js";
import { SVG } from "@mathjax/src/js/output/svg.js";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { COLORS } from "./site.js";

const ALL = [
  "base",
  "action",
  "ams",
  "amscd",
  "bbox",
  "boldsymbol",
  "braket",
  "bussproofs",
  "cancel",
  "cases",
  "centernot",
  "color",
  "colortbl",
  "configmacros",
  "empheq",
  "enclose",
  "extpfeil",
  "gensymb",
  "html",
  "mathtools",
  "mhchem",
  "newcommand",
  "noerrors",
  "noundefined",
  "tagformat",
  "textcomp",
  "textmacros",
  "unicode",
  "upgreek",
  "verb",
];
const PACKAGES = ALL.filter((p) => p !== "bussproofs");
// Fits a 390px phone, and breaks the vault's wide equations at sensible operators.
const NARROW = 32;
const MIN_INLINE_BREAK = 10;
const EX = 8;

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
mathjax.asyncLoad = (file) => import(file);

async function svgOutput(options) {
  const output = new SVG(options);
  await output.font.loadDynamicFiles();
  return output;
}

const noteDoc = mathjax.document("", { InputJax: new TeX({ packages: ALL, tags: "ams" }), OutputJax: await svgOutput({ fontCache: "local" }) });
const mmlDoc = mathjax.document("", { InputJax: new TeX({ packages: PACKAGES, tags: "ams" }) });
const svgDoc = mathjax.document("", { InputJax: new TeX({ packages: ALL }), OutputJax: await svgOutput({ fontCache: "local" }) });
const inlineDoc = mathjax.document("", { InputJax: new TeX({ packages: PACKAGES }), OutputJax: await svgOutput({ fontCache: "none" }) });
const visitor = new SerializedMmlVisitor();

export function resetMathTags() {
  for (const doc of [noteDoc, mmlDoc]) doc.inputJax[0].parseOptions.tags.reset();
}

/** Display math wider than NARROW also comes back line-broken to fit it. */
export function texToNoteSvg(tex, display) {
  if (!display) return { wide: inline(noteDoc, tex) };
  const item = compile(noteDoc, tex, true);
  const wide = typeset(noteDoc, item, 80);
  if (liteWidth(wide) <= NARROW) return { wide };
  item.root.attributes.set("overflow", "linebreak");
  return { wide, narrow: typeset(noteDoc, item, NARROW) };
}

function inline(doc, tex) {
  const item = compile(doc, tex, false);
  const whole = typeset(doc, item, 80);
  if (liteWidth(whole) <= MIN_INLINE_BREAK) return whole;
  return typeset(doc, item, 80, true);
}

function compile(doc, tex, display) {
  const item = new doc.options.MathItem(tex, doc.inputJax[0], display);
  item.start.node = adaptor.body(doc.document);
  item.convert(doc, STATE.COMPILED);
  item.root.walkTree((node) => {
    node.attributes.unset("data-latex");
    node.attributes.unset("data-latex-item");
  });
  return item;
}

function typeset(doc, item, width, inlineBreaks = false) {
  const output = doc.outputJax;
  const { containerWidth } = output;
  item.setMetrics(2 * EX, EX, width * EX, 1);
  output.options.linebreaks.inline = inlineBreaks;
  const node = output.typeset(item, doc);
  output.containerWidth = containerWidth;
  return node;
}

function liteWidth(container) {
  const size =
    adaptor.getAttribute(container, "width") === "full"
      ? adaptor.getStyle(container, "min-width")
      : adaptor.getAttribute(adaptor.firstChild(container), "width");
  return parseFloat(size);
}

export const isProofTree = (tex) => /\\begin\{prooftree\}/.test(tex);

export function mathImageName(tex) {
  return `${createHash("sha256").update(tex).digest("hex").slice(0, 16)}.svg`;
}

export function texToMathml(tex, display) {
  return visitor.visitTree(compile(mmlDoc, tex, display).root);
}

export function texToSvg(tex) {
  const svg = adaptor.innerHTML(typeset(svgDoc, compile(svgDoc, tex, true), 80));
  const xmlns = svg.includes("xmlns=") ? "" : 'xmlns="http://www.w3.org/2000/svg" ';
  return svg.replace("<svg ", `<svg ${xmlns}color="${COLORS.lightInk}" `).replace('style="', 'style="background: white; ');
}

export function texToInlineSvg(tex) {
  const node = inline(inlineDoc, tex);
  for (const svg of adaptor.childNodes(node)) {
    adaptor.removeAttribute(svg, "role");
    adaptor.setAttribute(svg, "aria-hidden", "true");
  }
  adaptor.setAttribute(node, "aria-label", tex);
  adaptor.setAttribute(node, "role", "img");
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
