// Cleans the HTML that the unified pipeline writes, so it passes html-validate.
// Table cells carry alignment as `style` in place of the obsolete `align`, and
// MathJax's per-page <style> is dropped, since global.css holds those rules.
export function rehypeTidy() {
  return (tree) => walk(tree);
}

function walk(node) {
  if (!node.children) return;
  node.children = node.children.filter((child) => !(child.type === "element" && child.tagName === "style"));
  for (const child of node.children) {
    if (child.type === "element" && (child.tagName === "th" || child.tagName === "td") && child.properties?.align) {
      child.properties.style = `text-align: ${child.properties.align}`;
      delete child.properties.align;
    }
    walk(child);
  }
}
