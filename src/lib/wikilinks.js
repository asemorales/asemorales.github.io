import { slug } from "github-slugger";
import { BACK_IDS } from "./headings.js";

export const WIKILINK = /(?<!!)\[\[([^\]|#]*)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]/g;
export const CODE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$|`[^`\n]+`/gm;

export function linkTargets(markdown) {
  const out = new Set();
  for (const m of markdown.replace(CODE, "").matchAll(WIKILINK)) {
    if (m[1].trim()) out.add(m[1].trim().toLowerCase());
  }
  return [...out];
}

export function seeAlsoLists(note, notes) {
  const others = notes.filter((n) => n.id !== note.id).sort((a, b) => a.data.title.localeCompare(b.data.title));
  const targets = linkTargets(note.body ?? "");
  return [
    {
      count: (n) => (n === 1 ? "1 link to another note" : `${n} links to other notes`),
      notes: others.filter((n) => targets.includes(n.id)),
    },
    {
      count: (n) => (n === 1 ? "1 note that links here" : `${n} notes that link here`),
      notes: others.filter((n) => linkTargets(n.body ?? "").includes(note.id)),
    },
  ].filter((l) => l.notes.length > 0);
}

export function notesWithSeeAlso(notes) {
  const ids = new Set(notes.map((n) => n.id));
  return notes.flatMap((n) => {
    const targets = linkTargets(n.body).filter((t) => t !== n.id && ids.has(t));
    return targets.length > 0 ? [n.id, ...targets] : [];
  });
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
