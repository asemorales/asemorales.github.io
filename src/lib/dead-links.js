import { isElement, walk } from "./hast.js";

export const DEAD_AFTER = 2;

export function archived(url, status) {
  const entry = status[url];
  if (!entry || entry.failures < DEAD_AFTER) return null;
  return { href: `https://web.archive.org/web/${entry.firstSeen.replaceAll("-", "")}/${url}`, since: entry.deadSince };
}

export function rehypeDeadLinks({ status = {} } = {}) {
  return (tree) => {
    walk(tree, (node) => {
      if (!isElement(node, "a")) return false;
      const copy = archived(String(node.properties.href ?? ""), status);
      if (!copy) return true;
      node.properties.href = copy.href;
      node.properties.className = [...(node.properties.className ?? []), "dead"];
      if (copy.since) node.properties.dataDeadSince = copy.since;
      return true;
    });
  };
}
