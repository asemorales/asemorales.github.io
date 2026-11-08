import { toHtml } from "hast-util-to-html";
import { el, isElement, text, txt, walk } from "./hast.js";

const FORMATTING = new Set(["em", "strong", "code", "del"]);

export function citationRef(citations, li, id, path) {
  const source = citation(li);
  if (!source)
    throw new Error(
      `${path}: footnote [^${id}] must be text, or one external link optionally followed by text, with only italics, bold, code, or strikethrough.`,
    );
  const key = source.url ?? source.text;
  let entry = citations.get(key);
  if (!entry) {
    entry = { url: source.url, text: source.text, n: citations.size + 1, locators: [], refs: [] };
    citations.set(key, entry);
  }
  if (source.locator && !entry.locators.includes(source.locator)) entry.locators.push(source.locator);
  const refId = `cite-ref-${entry.n}-${entry.refs.length + 1}`;
  entry.refs.push(refId);
  return [
    el("sup", { className: ["cite-ref"], id: refId }, [
      el("a", { href: `#ref-${entry.n}`, ariaLabel: `Reference ${entry.n}` }, [txt(`[${entry.n}]`)]),
    ]),
  ];
}

export function rehypeBibliography() {
  return (tree, file) => {
    const references = (file.data.citations ?? []).map((c) => ({ ...c, refs: [...c.refs] }));
    const cited = new Map(references.filter((c) => c.url).map((c) => [c.url, c]));
    const links = new Map();
    walk(tree, (node) => {
      if (!isElement(node, "a")) return false;
      const href = String(node.properties.href ?? "");
      if (!/^https?:\/\//.test(href)) return true;
      const reference = cited.get(href);
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
    file.data.astro.frontmatter.references = references;
    file.data.astro.frontmatter.externalLinks = [...links.values()].map(({ url, text, refs }) => ({ url, text, refs }));
  };
}

function citation(li) {
  const blocks = significant(li.children);
  if (blocks.length !== 1 || !isElement(blocks[0], "p")) return null;
  const { children } = blocks[0];
  const [link] = significant(children);
  const linked = isElement(link, "a");
  if (linked && !/^https?:\/\//.test(String(link.properties.href ?? ""))) return null;
  const rest = (linked ? children.slice(children.indexOf(link) + 1) : children).filter(
    (c) => !isElement(c) || c.properties?.dataFootnoteBackref === undefined,
  );
  if (!rest.every(formattedText)) return null;
  const html = toHtml(rest)
    .trim()
    .replace(/^[,;:]\s*/, "")
    .replace(/\.$/, "");
  if (linked) return { url: String(link.properties.href), text: text(link).trim(), locator: html };
  return html ? { text: html } : null;
}

function formattedText(node) {
  return node.type === "text" || (isElement(node) && FORMATTING.has(node.tagName) && node.children.every(formattedText));
}

function significant(children) {
  return children.filter((c) => !(c.type === "text" && !c.value.trim()) && !(isElement(c) && c.properties?.dataFootnoteBackref !== undefined));
}
