import { el, hasClass, isElement } from "./hast.js";

export function rehypeBlocks() {
  return (tree) => wrap(tree);
}

function wrap(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (isElement(child, "pre") && hasClass(child, "astro-code")) return el("div", { className: ["code-block"] }, [child]);
    if (isElement(child, "table")) return el("section", { className: ["table-block"], ariaLabel: "Table", tabIndex: 0 }, [child]);
    if (isElement(child, "mjx-container") && child.properties.display === "true") {
      const { dataTex, ...properties } = child.properties;
      return el("div", { className: ["math-block"], dataTex }, [{ ...child, properties }]);
    }
    wrap(child);
    return child;
  });
}
