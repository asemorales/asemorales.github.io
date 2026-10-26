// Rewrites GFM footnotes as Tufte CSS sidenotes, with no JS. Each note moves
// next to its first reference as
//
//   <label for="sn-x" class="sidenote-number" id="snref-x">1</label>
//   <input type="checkbox" id="sn-x" class="margin-toggle">
//   <span class="sidenote">…</span>
//
// On wide screens CSS floats the note into the right margin. On phones the
// number toggles the checkbox, which shows the note below the line. Later
// references to the same note link back to the first. The footnote list at the
// bottom is removed.
import { el, hasClass, isElement, txt, walk } from "./hast.js";

const PREFIX = "user-content-fn-";
// Block elements that can't sit inside a <p>, and the span each one becomes.
const BLOCKS = new Set(["p", "div", "ul", "ol", "li", "blockquote", "pre", "table"]);

export function rehypeSidenotes() {
  return (tree) => {
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

    const placed = new Set();
    replace(tree, (node) => {
      if (!isElement(node, "sup")) return null;
      const a = node.children.find((c) => isElement(c, "a") && c.properties?.dataFootnoteRef !== undefined);
      if (!a) return null;
      const id = String(a.properties.href).replace(`#${PREFIX}`, "");
      const li = notes.get(id);
      if (!li) return null;
      const number = String(a.children.map((c) => c.value ?? "").join(""));
      if (placed.has(id)) {
        return [el("sup", { className: ["sidenote-ref"] }, [el("a", { href: `#snref-${id}`, ariaLabel: `Sidenote ${number}` }, [txt(number)])])];
      }
      placed.add(id);
      return [
        el("label", { htmlFor: `sn-${id}`, id: `snref-${id}`, className: ["sidenote-number"] }, [
          el("span", { className: ["sr-only"] }, [txt("Sidenote ")]),
          txt(number),
        ]),
        el("input", { type: "checkbox", id: `sn-${id}`, className: ["margin-toggle"] }),
        el("span", { className: ["sidenote"], role: "note" }, [
          el("span", { className: ["sidenote-mark"], ariaHidden: "true" }, [txt(number)]),
          txt(" "),
          ...inline(li.children),
        ]),
      ];
    });
  };
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
