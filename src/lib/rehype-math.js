import { h } from "hastscript";
import { classes, el, isElement, text, txt, walk } from "./hast.js";
import { resetMathTags, texToMathml, texToNoteSvg } from "./math.js";

const MIN_SHRINK = 20;

export function rehypeMath() {
  return (tree, file) => {
    resetMathTags();
    walk(tree, (node, parent) => {
      const code = isElement(node, "pre") && node.children.length === 1 ? node.children[0] : node;
      const math = classes(code);
      if (!math.includes("language-math") && !math.includes("math-inline")) return false;
      const tex = text(code).trim();
      const display = node !== code || math.includes("math-display");
      parent.children.splice(parent.children.indexOf(node), 1, render(tex, display, file, node));
      return true;
    });
  };
}

function render(tex, display, file, node) {
  try {
    const { wide, narrow } = texToNoteSvg(tex, display);
    return label(fromLite(wide), narrow && fromLite(narrow), tex, display);
  } catch (cause) {
    file.message("Could not render math with MathJax", { cause, place: node.position, ruleId: "mathjax-error", source: "rehype-math" });
    return el("span", { className: ["mathjax-error"], style: "color:#cc0000", title: String(cause) }, [txt(tex)]);
  }
}

function label(container, narrow, tex, display) {
  const svgs = container.children.filter((c) => isElement(c, "svg"));
  if (display) container.properties.dataTex = tex;
  const w = width(narrow ?? container, display);
  const vars = [w > MIN_SHRINK && `--w:${w};`, narrow && `--wide:${width(container, display)};`].filter(Boolean).join("");
  if (narrow) {
    container.properties.style = narrow.properties.style;
    for (const svg of narrow.children.filter((c) => isElement(c, "svg"))) container.children.push(hideCopy(svg));
  }
  if (vars) container.properties.style = `${String(container.properties.style ?? "").replace(/;?\s*$/, ";")}${vars}`.replace(/^;/, "");
  const links = [];
  for (const svg of svgs) {
    delete svg.properties.role;
    walk(svg, (n) => n.tagName === "a" && links.push(n));
  }
  if (links.length === 0) {
    for (const svg of svgs) svg.properties.ariaHidden = "true";
    container.children.push(el("mjx-assistive-mml", {}, [{ type: "raw", value: texToMathml(tex, display) }]));
  } else for (const a of links) a.properties["aria-label"] = tex.replace(/\s+/g, " ");
  return container;
}

function width(container, display) {
  if (display && container.properties.width === "full") return parseFloat(String(container.properties.style).match(/min-width:\s*([\d.]+)ex/)?.[1]);
  const pieces = container.children
    .filter((c) => isElement(c, "svg"))
    .map((s) => parseFloat(String(s.properties.width).match(/([\d.]+)ex/)?.[1]) || 0);
  return Math.max(...pieces);
}

function hideCopy(svg) {
  svg.properties.dataNarrow = "";
  svg.properties.ariaHidden = "true";
  delete svg.properties.role;
  walk(svg, (n) => {
    if (String(n.properties.id ?? "").startsWith("mjx-eqn")) delete n.properties.id;
    if (n.tagName === "a") n.properties.tabIndex = -1;
    return false;
  });
  return svg;
}

function fromLite(node) {
  if ("value" in node) return txt(node.value);
  return h(node.kind, node.attributes, node.children.map(fromLite));
}
