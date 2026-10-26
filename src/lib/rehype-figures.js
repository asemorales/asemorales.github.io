// Turns a paragraph that holds only an image into a <figure>. An italic line
// right below the image, in the same paragraph, becomes its caption:
//
//   ![[orbit.svg|An ellipse around a dot]]
//   *An orbit, drawn to no scale.*
//
// In Obsidian the italic line already reads as a caption under the image.
import { el, isElement } from "./hast.js";

export function rehypeFigures() {
  return (tree) => transform(tree);
}

function transform(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (!isElement(child)) return child;
    if (isElement(child, "p")) return figure(child) ?? child;
    transform(child);
    return child;
  });
}

function figure(p) {
  const [img, caption, ...rest] = p.children.filter((c) => c.type !== "text" || c.value.trim());
  if (!isElement(img, "img") || rest.length) return null;
  if (caption && !isElement(caption, "em")) return null;
  return el("figure", {}, [img, ...(caption ? [el("figcaption", {}, caption.children)] : [])]);
}
