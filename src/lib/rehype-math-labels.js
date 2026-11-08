import { classes, el, isElement, text, walk } from "./hast.js";
import { resetMathTags, texToMathml } from "./math.js";

const MATH = ["language-math", "math-inline", "math-display"];

export function rehypeMathSource() {
  return (tree, file) => {
    const tex = [];
    walk(tree, (node) => {
      if (!MATH.some((c) => classes(node).includes(c))) return false;
      tex.push(text(node).trim());
      return true;
    });
    file.data.mathTex = tex;
  };
}

export function rehypeMathLabels() {
  return (tree, file) => {
    const tex = file.data.mathTex ?? [];
    let i = 0;
    resetMathTags();
    walk(tree, (node) => {
      if (classes(node).includes("mathjax-error")) return (i++, true);
      if (node.tagName !== "mjx-container") return false;
      const source = tex[i++];
      const svg = node.children.find((c) => isElement(c, "svg"));
      if (!svg || !source) return true;
      const display = node.properties.display === "true";
      if (display) node.properties.dataTex = source;
      const links = [];
      walk(svg, (n) => n.tagName === "a" && links.push(n));
      if (links.length === 0) {
        delete svg.properties.role;
        svg.properties.ariaHidden = "true";
        node.children.push(el("mjx-assistive-mml", {}, [{ type: "raw", value: texToMathml(source, display) }]));
      } else {
        delete svg.properties.role;
        for (const a of links) a.properties["aria-label"] = source.replace(/\s+/g, " ");
      }
      return true;
    });
  };
}
