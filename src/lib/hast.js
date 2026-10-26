// Small helpers shared by the rehype plugins in this folder.

export function el(tagName, properties = {}, children = []) {
  return { type: "element", tagName, properties, children };
}

export function txt(value) {
  return { type: "text", value };
}

// Calls visit(node, parent) on each element, depth first, and skips a node's
// children when visit returns true.
export function walk(node, visit) {
  for (const child of [...(node.children ?? [])]) {
    if (child.type !== "element") continue;
    if (!visit(child, node)) walk(child, visit);
  }
}

// Shiki's nodes carry `class` in place of hast's usual `className`.
export function classes(node) {
  const c = node.properties?.className ?? node.properties?.class;
  return Array.isArray(c) ? c : typeof c === "string" ? c.split(/\s+/) : [];
}

export function hasClass(node, name) {
  return node.type === "element" && classes(node).includes(name);
}

export function text(node) {
  return node.type === "text" ? node.value : (node.children ?? []).map(text).join("");
}

export function isElement(node, tagName) {
  return node?.type === "element" && (tagName === undefined || node.tagName === tagName);
}
