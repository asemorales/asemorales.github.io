// Points dead external links at the Wayback Machine. The weekly links workflow
// records each link's state in src/data/links-status.json (see
// scripts/link-status.js), and a link is dead after two failed runs in a row.
//
// A dead link's href becomes https://web.archive.org/web/<YYYYMMDD>/<url>, with
// the date the link was first seen, and the Wayback Machine redirects to the
// snapshot nearest it. So the build makes no requests. The link gets a `dead`
// class, and data-dead-since for the popover.
import { isElement, walk } from "./hast.js";

export const DEAD_AFTER = 2;

// The archived copy of a dead link, or null for a live or unknown one.
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
