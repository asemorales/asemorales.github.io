// Rewrites GFM footnotes as Tufte CSS sidenotes and numbered citations, with
// no JS. Markers follow Wikipedia: sidenotes are lettered ([a], [b], … [z],
// [aa]) and citations numbered ([1], [2]), so a reader knows which a marker is
// before following it.
//
// A footnote whose body is a single link, optionally followed by a locator
// ("p. 45"), is a citation. Its marker links to the entry under References, and
// a source cited twice keeps its number. The citations go to the page as
// file.data.citations, in order of first citation.
//
// Any other footnote is a sidenote, moved next to its first reference as
//
//   <label for="sn-x" class="sidenote-number" id="snref-x">[a]</label>
//   <input type="checkbox" id="sn-x" class="margin-toggle">
//   <span class="sidenote">…</span>
//
// On wide screens CSS floats the note into the right margin. On phones the
// marker toggles the checkbox, which shows the note below the line. Later
// references to the same note link back to the first. A sidenote can cite a
// source. The footnote list at the bottom is removed.
import { el, hasClass, isElement, text, txt, walk } from "./hast.js";

const PREFIX = "user-content-fn-";
// Block elements that can't sit inside a <p>, and the span each one becomes.
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

// a, b, … z, aa, ab, … as Wikipedia letters its notes.
export function letter(i) {
  let s = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(97 + ((n - 1) % 26)) + s;
  return s;
}

// A footnote whose body is one external link and an optional locator, as in
// "[Smith 2010](https://…), p. 45". Returns null for any other footnote.
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

// Children other than blank text and GFM's backlinks to the reference.
function significant(children) {
  return children.filter((c) => !(c.type === "text" && !c.value.trim()) && !(isElement(c) && c.properties?.dataFootnoteBackref !== undefined));
}

// The note's paragraphs become spans, since a sidenote sits inside the
// paragraph that cites it. Backlinks to the reference are dropped.
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

// Replaces each element for which fn returns a list, depth first.
function replace(node, fn) {
  if (!node.children) return;
  node.children = node.children.flatMap((child) => {
    const out = isElement(child) ? fn(child) : null;
    if (out) return out;
    if (!hasClass(child, "sidenote")) replace(child, fn);
    return [child];
  });
}
