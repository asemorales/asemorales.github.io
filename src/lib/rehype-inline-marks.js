import { classes, el, isElement, text, txt, walk } from "./hast.js";

const LONG = 30;
const SENTENCE_END = /[.!?]["'”’)]*$/;
const WRAPPERS = new Set(["em", "strong", "del", "mark"]);

export function rehypeInlineMarks() {
  return (tree) => {
    walk(tree, (node, parent) => {
      if (isElement(node, "p")) markLeadIn(node);
      if (isElement(node, "code") && !isElement(parent, "pre") && /^\S+$/.test(text(node)) && text(node).length > LONG)
        node.properties.className = [...classes(node), "long"];
      return false;
    });
    glueMath(tree);
  };
}

function markLeadIn(paragraph) {
  const [first, next] = paragraph.children;
  const endsSentence = isElement(first, "strong") && SENTENCE_END.test(text(first).trim());
  if (endsSentence && (next?.type !== "text" || /^\s/.test(next.value))) first.properties.className = ["lead-in"];
}

function glueMath(node) {
  if (!node.children || isInlineMath(node) || isElement(node, "pre") || isElement(node, "svg")) return;
  node.children.forEach(glueMath);
  const out = [];
  node.children.forEach((child, i) => {
    const prev = out.at(-1);
    const before = edgeMath(child, 0) && prev?.type === "text" ? prev.value.match(/\S+$/) : null;
    const next = node.children[i + 1];
    const after = edgeMath(child, -1) && next?.type === "text" ? next.value.match(/^\S+/) : null;
    if (!before && !after) return out.push(child);
    let rest = child;
    let lead = null;
    if (before) {
      prev.value = prev.value.slice(0, before.index);
      const { edge, rest: remaining } = split(rest, 0);
      lead = nowrap([txt(before[0]), edge]);
      rest = remaining;
    }
    let tail = null;
    if (after) {
      next.value = next.value.slice(after[0].length);
      if (rest) {
        const { edge, rest: remaining } = split(rest, -1);
        tail = nowrap([edge, txt(after[0])]);
        rest = remaining;
      } else lead.children.push(txt(after[0]));
    }
    out.push(...[lead, rest, tail].filter(Boolean));
  });
  node.children = out.filter((c) => c.type !== "text" || c.value);
}

function split(node, at) {
  if (isInlineMath(node)) return { edge: node, rest: null };
  const i = at < 0 ? node.children.length - 1 : 0;
  const inner = split(node.children[i], at);
  const children = node.children.toSpliced(i, 1, ...(inner.rest ? [inner.rest] : []));
  const rest = children.some((c) => c.type !== "text" || c.value.trim()) ? { ...node, children } : null;
  return { edge: { ...node, children: [inner.edge] }, rest };
}

function nowrap(children) {
  return el("span", { className: ["nowrap"] }, children);
}

function edgeMath(node, at) {
  if (isInlineMath(node)) return true;
  return isElement(node) && WRAPPERS.has(node.tagName) && edgeMath(node.children.at(at), at);
}

function isInlineMath(node) {
  return isElement(node, "mjx-container") && node.properties.display !== "true";
}
