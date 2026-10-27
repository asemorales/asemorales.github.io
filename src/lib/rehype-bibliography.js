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
