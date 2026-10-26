// Collects a note's external links, in order of first appearance, for the
// bibliography at the bottom of the page. Each citation gets an id, so the
// bibliography's backlinks (↑ a, b, c) can jump to it. The list goes to the
// page as remarkPluginFrontmatter.bibliography.
import { isElement, text, walk } from "./hast.js";

export function rehypeBibliography() {
  return (tree, file) => {
    const entries = new Map();
    walk(tree, (node) => {
      if (!isElement(node, "a")) return false;
      const href = String(node.properties.href ?? "");
      if (!/^https?:\/\//.test(href)) return true;
      let entry = entries.get(href);
      if (!entry) {
        entry = { url: href, text: text(node).trim(), n: entries.size + 1, refs: [] };
        entries.set(href, entry);
      }
      const id = `cite-${entry.n}-${entry.refs.length + 1}`;
      node.properties.id = id;
      entry.refs.push(id);
      return true;
    });
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.bibliography = [...entries.values()].map(({ url, text, refs }) => ({ url, text, refs }));
  };
}
