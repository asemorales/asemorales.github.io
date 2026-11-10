import { markType } from "./glossary.js";
import { el, figureElement, isElement, txt } from "./hast.js";

const MARKER = /^\s*\[!([a-z-]+)\][+-]?[ \t]*/i;
const FORMATTING = new Set(["a", "em", "strong", "del"]);

export function rehypeCallouts() {
  return (tree) => transform(tree);
}

function transform(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (!isElement(child)) return child;
    transform(child);
    return isElement(child, "blockquote") ? keepId(child, callout(child)) : child;
  });
}

function keepId(quote, out) {
  if (quote.properties.id) out.properties = { ...out.properties, id: quote.properties.id };
  return out;
}

function callout(quote) {
  const parsed = parse(quote);
  if (!parsed) return { ...quote, children: keepLineBreaks(quote.children) };
  const { type, title, body } = parsed;
  switch (type) {
    case "status":
      return el("aside", { className: ["status"], ariaLabel: "Status" }, [
        ...(title.length ? [el("p", { className: ["callout-title"] }, title)] : []),
        ...body,
      ]);
    case "definition":
      return definition(title, body);
    case "wide":
      return el("div", { className: ["wide"] }, body);
    case "figure":
      return figure(body) ?? quote;
    case "wide-figure": {
      const wide = figure(body);
      return wide ? el("div", { className: ["wide"] }, [wide]) : quote;
    }
    default:
      return el("blockquote", {}, [...keepLineBreaks(body), ...attribution(title)]);
  }
}

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

function keepLineBreaks(blocks) {
  return blocks.map((block) => (isElement(block, "p") ? { ...block, children: block.children.flatMap(breakLines) } : block));
}

function breakLines(node) {
  if (node.type === "text") return node.value.split("\n").flatMap((line, i) => (i ? [el("br", {}, []), txt("\n"), txt(line)] : [txt(line)]));
  if (isElement(node) && FORMATTING.has(node.tagName)) return [{ ...node, children: node.children.flatMap(breakLines) }];
  return [node];
}

function definition(title, body) {
  const heading = el("p", { className: ["callout-title"] }, title);
  markType(heading);
  return el("div", { className: ["definition"], role: "group", ariaLabel: "Definition" }, [
    ...(title.length ? [heading] : []),
    ...body.map((node) => (isElement(node) && /^h[1-6]$/.test(node.tagName) ? el("p", { className: ["definition-label"] }, node.children) : node)),
  ]);
}

function figure(body) {
  const [img, ...caption] = body[0]?.children ?? [];
  if (!isElement(img, "img")) return null;
  return figureElement(img, trim(caption));
}

function attribution(title) {
  return title.length ? [el("footer", {}, title)] : [];
}

function trim(nodes) {
  const out = nodes.map((n) => ({ ...n }));
  if (out[0]?.type === "text") out[0].value = out[0].value.replace(/^\s+/, "");
  const last = out.at(-1);
  if (last?.type === "text") last.value = last.value.replace(/\s+$/, "");
  return out.filter((n) => n.type !== "text" || n.value);
}
