import { isElement, walk } from "./hast.js";

export function rehypeTidy() {
  return (tree) => tidy(tree);
}

function tidy(root) {
  root.children = root.children.filter((child) => !isElement(child, "style"));
  walk(root, (node) => {
    node.children = node.children.filter((child) => !isElement(child, "style"));
    if ((node.tagName === "th" || node.tagName === "td") && node.properties?.align) {
      node.properties.style = `text-align: ${node.properties.align}`;
      delete node.properties.align;
    }
    return false;
  });
}
