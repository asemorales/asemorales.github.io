import { el, hasClass, isElement, txt, walk } from "./hast.js";
import { citationRef } from "./rehype-bibliography.js";

const PREFIX = "user-content-fn-";
const CITATION = "cite-";
const BLOCKS = new Set(["p", "div", "ul", "ol", "li", "blockquote", "footer", "aside", "pre", "table"]);
const BLOCK_CLASSES = {
  blockquote: ["sidenote-block", "sidenote-quote"],
  footer: ["sidenote-block", "sidenote-attribution"],
  ul: ["sidenote-block", "sidenote-list"],
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

      if (id.startsWith(CITATION)) return citationRef(citations, li, id, file.path);

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

function inline(children) {
  const out = [];
  for (const child of children) {
    if (child.type === "text" && !/[^ \t\n]/.test(child.value)) continue;
    if (isElement(child) && child.properties?.dataFootnoteBackref !== undefined) continue;
    if (isElement(child) && BLOCKS.has(child.tagName)) {
      const inner = inline(child.children);
      trimEnd(inner);
      out.push(el("span", blockProps(child), inner));
      continue;
    }
    out.push(child);
  }
  return out;
}

function blockProps(node) {
  if (isElement(node, "aside") || hasClass(node, "definition")) {
    return { className: ["sidenote-block", `sidenote-${node.properties.className[0]}`], role: "group", ariaLabel: node.properties.ariaLabel };
  }
  if (hasClass(node, "callout-title")) return { className: ["sidenote-block", "sidenote-title"] };
  if (hasClass(node, "definition-label")) return { className: ["sidenote-block", "definition-label"] };
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
