// Builds the note's back matter from its sources, as Wikipedia does.
//
// References are the citations rehypeSidenotes found, numbered in order of
// first citation. External links are the other external links in the prose and
// sidenotes, unnumbered, in order of first appearance. A URL that is also cited
// appears only under References, and its links in the prose count as citations.
// Each link gets an id, so the entries' backlinks (↑ a, b, c) can jump to it.
//
// Both lists go to the page as remarkPluginFrontmatter.references and
// remarkPluginFrontmatter.externalLinks.
import { isElement, text, walk } from "./hast.js";

export function rehypeBibliography() {
  return (tree, file) => {
    const references = new Map((file.data.citations ?? []).map((c) => [c.url, { ...c, refs: [...c.refs] }]));
    const links = new Map();
    walk(tree, (node) => {
      if (!isElement(node, "a")) return false;
      const href = String(node.properties.href ?? "");
      if (!/^https?:\/\//.test(href)) return true;
      const reference = references.get(href);
      if (reference) {
        node.properties.id = `cite-ref-${reference.n}-${reference.refs.length + 1}`;
        reference.refs.push(node.properties.id);
        return true;
      }
      let entry = links.get(href);
      if (!entry) {
        entry = { url: href, text: text(node).trim(), n: links.size + 1, refs: [] };
        links.set(href, entry);
      }
      node.properties.id = `link-${entry.n}-${entry.refs.length + 1}`;
      entry.refs.push(node.properties.id);
      return true;
    });
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.references = [...references.values()];
    file.data.astro.frontmatter.externalLinks = [...links.values()].map(({ url, text, refs }) => ({ url, text, refs }));
  };
}
