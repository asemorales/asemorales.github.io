import { slug } from "github-slugger";
import { BACK_IDS } from "./rehype-sections.js";

export const WIKILINK = /(?<!!)\[\[([^\]|#]*)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]/g;
const FENCE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$|`[^`\n]+`/gm;

export function linkTargets(markdown) {
  const out = new Set();
  for (const m of markdown.replace(FENCE, "").matchAll(WIKILINK)) {
    if (m[1].trim()) out.add(m[1].trim().toLowerCase());
  }
  return [...out];
}

export function remarkWikilinks({ slugs = [] } = {}) {
  const known = new Set(slugs);
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== "text" || !node.value.includes("[[")) return undefined;
      const parts = [];
      let last = 0;
      for (const m of node.value.matchAll(WIKILINK)) {
        if (m.index > last) parts.push({ type: "text", value: node.value.slice(last, m.index) });
        parts.push(resolve(m, known));
        last = m.index + m[0].length;
      }
      if (parts.length === 0) return undefined;
      if (last < node.value.length) parts.push({ type: "text", value: node.value.slice(last) });
      return parts;
    });
  };
}

function resolve([, rawTarget, rawHeading, rawAlias], known) {
  const target = rawTarget.trim();
  const heading = rawHeading?.trim();
  const alias = rawAlias?.trim();
  const label = alias || (target && heading ? `${target} > ${heading}` : heading || target);
  const hash = heading ? `#${headingId(heading)}` : "";
  if (target ? !known.has(target.toLowerCase()) : !hash) return { type: "text", value: label };
  const url = target ? `/${target.toLowerCase()}/${hash}` : hash;
  return { type: "link", url, children: [{ type: "text", value: label }] };
}

function headingId(heading) {
  const id = slug(heading);
  return BACK_IDS.includes(id) ? `${id}-1` : id;
}

function visit(node, fn) {
  if (!node.children) return;
  node.children = node.children.flatMap((child) => {
    const replaced = fn(child);
    if (replaced) return replaced;
    visit(child, fn);
    return [child];
  });
}
