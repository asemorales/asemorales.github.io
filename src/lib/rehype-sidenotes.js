import { toHtml } from "hast-util-to-html";
import { el, hasClass, isElement, text, txt, walk } from "./hast.js";

const PREFIX = "user-content-fn-";
const CITATION = "cite-";
const FORMATTING = new Set(["em", "strong", "code", "del"]);
const BLOCKS = new Set(["p", "div", "ul", "ol", "li", "blockquote", "footer", "aside", "dl", "dt", "dd", "pre", "table"]);
const BLOCK_CLASSES = {
  blockquote: ["sidenote-block", "sidenote-quote"],
  footer: ["sidenote-block", "sidenote-attribution"],
  dl: ["sidenote-block", "sidenote-facts"],
  dt: ["sidenote-key"],
  dd: ["sidenote-value"],
};

export function rehypeSidenotes() {
  return (tree, file) => {
    const notes = new Map();
    let section = null;
    walk(tree, (node, parent) => {
      if (!(isElement(node, "section") && node.properties?.dataFootnotes !== undefined)) return false;
      section = { node, parent };
      walk(node, (li) => {
        if (!isElement(li, "li") || !String(li.properties?.id).startsWith(PREFIX)) return false;
        notes.set(String(li.properties.id).slice(PREFIX.length), li);
        return true;
      });
      return true;
    });
    if (!section) return;
    section.parent.children = section.parent.children.filter((c) => c !== section.node);

    const letters = new Map();
    const placed = new Set();
    const citations = new Map();
    const rewrite = (node) => {
      if (!isElement(node, "sup")) return null;
      const a = node.children.find((c) => isElement(c, "a") && c.properties?.dataFootnoteRef !== undefined);
      if (!a) return null;
      const id = String(a.properties.href).replace(`#${PREFIX}`, "");
      const li = notes.get(id);
      if (!li) return null;

      if (id.startsWith(CITATION)) {
        const source = citation(li);
        if (!source)
          throw new Error(
            `${file.path}: footnote [^${id}] must be text, or one external link optionally followed by text, with only italics, bold, code, or strikethrough.`,
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

      if (!letters.has(id)) letters.set(id, letter(letters.size));
      const mark = letters.get(id);
      if (placed.has(id)) {
        return [el("sup", { className: ["sidenote-ref"] }, [el("a", { href: `#snref-${id}`, ariaLabel: `Note ${mark}` }, [txt(`[${mark}]`)])])];
      }
      placed.add(id);
      const body = el("span", { className: ["sidenote"], role: "note" }, [
        el("span", { className: ["sidenote-mark"], ariaHidden: "true" }, [txt(mark)]),
        txt(" "),
        ...inline(li.children),
      ]);
      replace(body, rewrite);
      return [
        el("label", { htmlFor: `sn-${id}`, id: `snref-${id}`, className: ["sidenote-number"] }, [
          el("span", { className: ["sr-only"] }, [txt("Note ")]),
          txt(`[${mark}]`),
        ]),
        el("input", { type: "checkbox", id: `sn-${id}`, className: ["margin-toggle"] }),
        body,
      ];
    };
    replace(tree, rewrite);

    file.data.citations = [...citations.values()].map(({ url, text, n, locators, refs }) => ({ url, text, n, locators, refs }));
  };
}

export function letter(i) {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(97 + ((n - 1) % 26)) + s;
  return s;
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

function inline(children) {
  const out = [];
  for (const child of children) {
    if (child.type === "text" && !child.value.trim()) continue;
    if (isElement(child) && child.properties?.dataFootnoteBackref !== undefined) continue;
    if (isElement(child) && BLOCKS.has(child.tagName)) {
      const inner = inline(child.children);
      trimEnd(inner);
      if (child.tagName === "li") out.push(...inner);
      else out.push(el("span", blockProps(child), inner));
      continue;
    }
    out.push(child);
  }
  return out;
}

function blockProps(node) {
  if (isElement(node, "aside")) {
    return { className: ["sidenote-block", `sidenote-${node.properties.className[0]}`], role: "group", ariaLabel: node.properties.ariaLabel };
  }
  if (hasClass(node, "callout-title")) return { className: ["sidenote-block", "sidenote-title"] };
  return { className: BLOCK_CLASSES[node.tagName] ?? ["sidenote-block"] };
}

function trimEnd(nodes) {
  const last = nodes.at(-1);
  if (last?.type === "text") last.value = last.value.replace(/\s+$/, "");
}

function replace(node, fn) {
  if (!node.children) return;
  node.children = node.children.flatMap((child) => {
    const out = isElement(child) ? fn(child) : null;
    if (out) return out;
    if (!hasClass(child, "sidenote")) replace(child, fn);
    return [child];
  });
}
