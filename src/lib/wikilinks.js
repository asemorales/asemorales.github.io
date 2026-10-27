import { slug } from "github-slugger";
import { BACK_IDS } from "./rehype-sections.js";
import { slugify } from "./slug.js";

const WIKILINK = /(?<!!)\[\[([^\]|#]*)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]/g;
const FENCE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$|`[^`\n]+`/gm;

export function linkTargets(markdown) {
  const out = new Set();
  for (const m of markdown.replace(FENCE, "").matchAll(WIKILINK)) {
    if (m[1].trim()) out.add(m[1].trim());
  }
  return [...out];
}

export function remarkWikilinks({ titles = [] } = {}) {
  const known = new Map(titles.map((t) => [key(t), t]));
  return (tree, file) => {
    const self = file.data.astro?.frontmatter?.title;
    visit(tree, (node) => {
      if (node.type !== "text" || !node.value.includes("[[")) return undefined;
      const parts = [];
      let last = 0;
      for (const m of node.value.matchAll(WIKILINK)) {
        if (m.index > last) parts.push({ type: "text", value: node.value.slice(last, m.index) });
        parts.push(resolve(m, known, self));
        last = m.index + m[0].length;
      }
      if (parts.length === 0) return undefined;
      if (last < node.value.length) parts.push({ type: "text", value: node.value.slice(last) });
      return parts;
    });
  };
}

function resolve([, rawTarget, rawHeading, rawAlias], known, self) {
  const target = rawTarget.trim();
  const heading = rawHeading?.trim();
  const alias = rawAlias?.trim();
  const title = target ? known.get(key(target)) : self;
  const label = alias || (target && heading ? `${target} > ${heading}` : heading || target);
  if (!title) return { type: "text", value: label };
  const hash = heading ? `#${headingId(heading)}` : "";
  const url = title === self && hash ? hash : `/${slugify(title)}/${hash}`;
  return { type: "link", url, children: [{ type: "text", value: label }] };
}

function headingId(heading) {
  const id = slug(heading);
  return BACK_IDS.includes(id) ? `${id}-1` : id;
}

function key(title) {
  return title.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
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
