// MathJax's SVG has role="img" but no name, so screen readers skip the math.
// rehypeMathSource records each formula's TeX before rehype-mathjax runs, and
// rehypeMathLabels names the SVGs after it, in the same document order. An SVG
// holding a link (from \eqref) loses role="img", which may not contain links,
// and the link takes the name. Display math also keeps its TeX as written, in
// data-tex, for the button that shows the source.
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
    walk(tree, (node) => {
      if (classes(node).includes("mathjax-error")) return (i++, true);
      if (node.tagName !== "mjx-container") return false;
      const source = tex[i++];
      const label = source?.replace(/\s+/g, " ");
      const svg = node.children.find((c) => c.tagName === "svg");
      if (!svg || !label) return true;
      if (node.properties.display === "true") node.properties.dataTex = source;
      const links = [];
      walk(svg, (n) => n.tagName === "a" && links.push(n));
      if (links.length === 0) svg.properties["aria-label"] = label;
      else {
        delete svg.properties.role;
        for (const a of links) a.properties["aria-label"] = label;
      }
      return true;
    });
  };
}

// Calls visit on each element, and skips its children when visit returns true.
function walk(node, visit) {
  for (const child of node.children ?? []) {
    if (child.type !== "element") continue;
    if (!visit(child)) walk(child, visit);
  }
}

function classes(node) {
  return Array.isArray(node.properties?.className) ? node.properties.className : [];
}

function text(node) {
  return node.type === "text" ? node.value : (node.children ?? []).map(text).join("");
}
