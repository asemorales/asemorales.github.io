export function summary(markdown, { paragraphs = Infinity } = {}) {
  const out = [];
  for (const block of markdown.trim().split(/\n\s*\n/)) {
    if (/^\s*([#>|`~$*+-]|\d+\.\s|!\[|<|%%)/.test(block)) break;
    out.push(plain(block));
    if (out.length >= paragraphs) break;
  }
  return out;
}

function plain(text) {
  return text
    .split(/(\$[^$\n]+\$)/)
    .map((part, i) => (i % 2 ? part : unmark(part)))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function unmark(text) {
  return text
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2")
    .replace(/\[\[([^\]#]*)(#[^\]]*)?\]\]/g, (_, t, h) => t || (h ?? "").slice(1))
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[\^[^\]]*\]/g, "")
    .replace(/(\*\*|__|\*|_|~~|`)/g, "");
}

export function clip(text, max = 400) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const end = Math.max(...[". ", "! ", "? "].map((p) => cut.lastIndexOf(p)));
  return end > max / 2 ? cut.slice(0, end + 1) : `${cut.replace(/\s+\S*$/, "")}…`;
}
