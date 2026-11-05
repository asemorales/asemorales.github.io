import { el, hasClass, isElement, text } from "./hast.js";

const LONG = 30;
const SENTENCE_END = /[.!?]["'”’)]*$/;

export function rehypeBlocks() {
  return (tree) => wrap(tree);
}

function markLeadIn(paragraph) {
  const [first, next] = paragraph.children;
  const endsSentence = isElement(first, "strong") && SENTENCE_END.test(text(first).trim());
  if (endsSentence && (next?.type !== "text" || /^\s/.test(next.value))) first.properties.className = ["lead-in"];
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
    if (isElement(child, "p")) markLeadIn(child);
    wrap(child);
    return child;
  });
}
