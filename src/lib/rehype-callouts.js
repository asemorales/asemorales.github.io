// Obsidian callouts, written as `> [!type] Title` on a quote's first line.
//
//   status    a quiet bordered box
//   infobox   a box of facts, from a list of `**Key:** value` lines
//   wide      its contents, such as a figure or table, across the right margin
//   epigraph  a quote with its attribution in a <footer>
//
// Every quote is an epigraph, so plain quotes and other types stay quotes,
// without the marker, and a title becomes the attribution.
import { el, isElement, text, txt } from "./hast.js";

const MARKER = /^\s*\[!([a-z-]+)\][+-]?[ \t]*/i;

export function rehypeCallouts() {
  return (tree) => transform(tree);
}

function transform(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (!isElement(child)) return child;
    transform(child);
    return isElement(child, "blockquote") ? callout(child) : child;
  });
}

function callout(quote) {
  const parsed = parse(quote);
  if (!parsed) return quote;
  const { type, title, body } = parsed;
  switch (type) {
    case "status":
      return el("aside", { className: ["status"], ariaLabel: "Status" }, [
        ...(title.length ? [el("p", { className: ["callout-title"] }, title)] : []),
        ...body,
      ]);
    case "infobox":
      return infobox(title, body);
    case "wide":
      return el("div", { className: ["wide"] }, body);
    default:
      return el("blockquote", {}, [...body, ...attribution(title)]);
  }
}

// Splits `[!type] Title` off the first paragraph. The title runs to the end of
// the first line and may hold inline markup.
function parse(quote) {
  const blocks = quote.children.filter((c) => c.type !== "text" || c.value.trim());
  const first = blocks[0];
  if (!isElement(first, "p") || first.children[0]?.type !== "text") return null;
  const match = first.children[0].value.match(MARKER);
  if (!match) return null;

  const rest = [{ ...first.children[0], value: first.children[0].value.slice(match[0].length) }, ...first.children.slice(1)];
  const title = [];
  let i = 0;
  for (; i < rest.length; i++) {
    const node = rest[i];
    const nl = node.type === "text" ? node.value.indexOf("\n") : -1;
    if (nl === -1) {
      title.push(node);
      continue;
    }
    title.push(txt(node.value.slice(0, nl)));
    rest[i] = txt(node.value.slice(nl + 1));
    break;
  }
  const inline = rest.slice(i).filter((n) => n.type !== "text" || n.value.trim());
  const body = [...(inline.length ? [{ ...first, children: inline }] : []), ...blocks.slice(1)];
  return { type: match[1].toLowerCase(), title: trim(title), body };
}

function attribution(title) {
  return title.length ? [el("footer", {}, title)] : [];
}

// An infobox lists `**Key:** value` lines as a table of facts. Anything else in
// the box stays as written.
function infobox(title, body) {
  const facts = body.map((block) => {
    if (!isElement(block, "ul")) return block;
    const items = block.children.filter((c) => isElement(c, "li"));
    const pairs = items.map(fact);
    if (pairs.some((p) => !p)) return block;
    return el(
      "dl",
      {},
      pairs.flatMap(([key, value]) => [el("dt", {}, key), el("dd", {}, value)]),
    );
  });
  const heading = title.length ? [el("p", { className: ["callout-title"] }, title)] : [];
  return el("aside", { className: ["infobox"], ariaLabel: text({ children: title }).trim() || "Infobox" }, [...heading, ...facts]);
}

function fact(li) {
  const children = li.children.filter((c) => c.type !== "text" || c.value.trim());
  const [strong, ...rest] = children;
  if (!isElement(strong, "strong")) return null;
  const key = text(strong).trim();
  if (!key.endsWith(":")) return null;
  return [[txt(key.slice(0, -1))], trim(rest)];
}

function trim(nodes) {
  const out = nodes.map((n) => ({ ...n }));
  if (out[0]?.type === "text") out[0].value = out[0].value.replace(/^\s+/, "");
  const last = out.at(-1);
  if (last?.type === "text") last.value = last.value.replace(/\s+$/, "");
  return out.filter((n) => n.type !== "text" || n.value);
}
