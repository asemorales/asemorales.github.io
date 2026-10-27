import { el, hasClass, isElement, text } from "./hast.js";

const LONG = 30;

export function rehypeBlocks() {
  return (tree) => wrap(tree);
}

function wrap(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (isElement(child, "pre") && hasClass(child, "astro-code")) return el("div", { className: ["code-block"] }, [child]);
    if (isElement(child, "mjx-container") && child.properties.display === "true") {
      const { dataTex, ...properties } = child.properties;
      return el("div", { className: ["math-block"], dataTex }, [{ ...child, properties }]);
    }
    if (isElement(child, "code") && !isElement(node, "pre") && /^\S+$/.test(text(child)) && text(child).length > LONG)
      child.properties.className = [...(child.properties.className ?? []), "long"];
    wrap(child);
    return child;
  });
}
