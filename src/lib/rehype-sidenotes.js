import { el, hasClass, isElement, text, txt, walk } from "./hast.js";

const PREFIX = "user-content-fn-";
const BLOCKS = new Set(["p", "div", "ul", "ol", "li", "blockquote", "pre", "table"]);

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

      const source = citation(li);
      if (source) {
        let entry = citations.get(source.url);
        if (!entry) {
          entry = { url: source.url, text: source.text, n: citations.size + 1, locators: [], refs: [] };
          citations.set(source.url, entry);
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
  const [link, ...rest] = significant(blocks[0].children);
  if (!isElement(link, "a") || !/^https?:\/\//.test(String(link.properties.href ?? ""))) return null;
  if (rest.some((n) => n.type !== "text")) return null;
  const locator = rest
    .map((n) => n.value)
    .join("")
    .trim()
    .replace(/^[,;:]\s*/, "")
    .replace(/\.$/, "");
  return { url: String(link.properties.href), text: text(link).trim(), locator };
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
      else out.push(el("span", { className: ["sidenote-block"] }, inner));
      continue;
    }
    out.push(child);
  }
  return out;
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
