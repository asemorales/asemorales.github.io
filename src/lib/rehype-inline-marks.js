import { classes, isElement, text, walk } from "./hast.js";

const LONG = 30;
const SENTENCE_END = /[.!?]["'”’)]*$/;

export function rehypeInlineMarks() {
  return (tree) =>
    walk(tree, (node, parent) => {
      if (isElement(node, "p")) markLeadIn(node);
      if (isElement(node, "code") && !isElement(parent, "pre") && /^\S+$/.test(text(node)) && text(node).length > LONG)
        node.properties.className = [...classes(node), "long"];
      return false;
    });
}

function markLeadIn(paragraph) {
  const [first, next] = paragraph.children;
  const endsSentence = isElement(first, "strong") && SENTENCE_END.test(text(first).trim());
  if (endsSentence && (next?.type !== "text" || /^\s/.test(next.value))) first.properties.className = ["lead-in"];
}
