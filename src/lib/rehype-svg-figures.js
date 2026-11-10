import fs from "node:fs";
import path from "node:path";
import { isElement, walk } from "./hast.js";
import { slugify } from "./slug.js";

const GRAY = /^#(?:([0-9a-f])\1\1|([0-9a-f]{2})\2\2)$/i;

export function rehypeSvgFigures() {
  return (tree, file) =>
    walk(tree, (node) => {
      if (!isElement(node, "figure")) return false;
      node.children = node.children.map((child) => {
        const src = isElement(child, "img") ? String(child.properties.src ?? "") : "";
        if (!src.startsWith("./") || !src.endsWith(".svg")) return child;
        const svg = fs.readFileSync(path.resolve(path.dirname(file.path), decodeURI(src)), "utf8");
        return { type: "raw", value: inlineSvg(svg, `svg-${slugify(path.basename(src, ".svg"))}`, String(child.properties.alt ?? "")) };
      });
      return true;
    });
}

export function inlineSvg(svg, id, alt) {
  const body = svg
    .replace(/<\?xml[^>]*>|<!DOCTYPE[^>]*>/g, "")
    .trim()
    .replace(/\bid="([^"]+)"/g, `id="${id}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${id}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${id}-$1"`);
  const rules = [...new Set([...body.matchAll(/\b(fill|stroke)="(#[0-9a-f]{3,6})"/gi)].map((m) => `${m[1]}="${m[2]}"`))]
    .map((attr) => {
      const [, prop, hex] = attr.match(/(\w+)="(.+)"/);
      const gray = hex.match(GRAY);
      if (!gray) return "";
      const ink = Math.round((1 - parseInt(gray[1] ? gray[1].repeat(2) : gray[2], 16) / 255) * 100);
      return `#${id} [${attr}]{${prop}:${ink ? `color-mix(in srgb,var(--ink) ${ink}%,var(--page))` : "transparent"}}`;
    })
    .join("");
  return body.replace(/^<svg\b([^>]*)>/, (_, attrs) => {
    const kept = attrs.replace(/\s(?:width|height|id)="[^"]*"/g, "");
    return `<svg id="${id}" role="img" aria-label="${escape(alt)}"${kept}><style>${rules}</style>`;
  });
}

function escape(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
