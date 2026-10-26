// A note's summary is its opening paragraphs: the plain paragraphs before the
// first heading, quote, list, or other block. Returns plain text.
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
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2")
    .replace(/\[\[([^\]#]*)(#[^\]]*)?\]\]/g, (_, t, h) => t || (h ?? "").slice(1))
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[\^[^\]]*\]/g, "")
    .replace(/(\*\*|__|\*|_|~~|`)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
