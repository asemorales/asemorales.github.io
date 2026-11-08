const LINK = /\]\((https?:\/\/(?:[^()\s]|\([^()\s]*\))+)|<(https?:\/\/[^>\s]+)>/g;

export function domain(url) {
  return new URL(url).hostname.replace(/^www\./, "");
}

export function linksIn(markdown) {
  return [...markdown.matchAll(LINK)].map((m) => m[1] ?? m[2]);
}

export function notesByLink(notes) {
  const byLink = new Map();
  for (const [file, markdown] of notes) {
    for (const url of new Set(linksIn(markdown))) byLink.set(url, [...(byLink.get(url) ?? []), file]);
  }
  return byLink;
}

export function classify(url) {
  const u = new URL(url);
  const host = domain(url);
  const parts = u.pathname.split("/").filter(Boolean);
  if (host === "github.com" && parts.length === 2) return { kind: "github", id: `${parts[0]}/${parts[1].replace(/\.git$/, "")}` };
  if (host === "arxiv.org" && ["abs", "pdf"].includes(parts[0]) && parts[1])
    return {
      kind: "arxiv",
      id: parts
        .slice(1)
        .join("/")
        .replace(/\.pdf$/, "")
        .replace(/v\d+$/, ""),
    };
  if (host === "doi.org" || host === "dx.doi.org") return { kind: "doi", id: decodeURIComponent(u.pathname.slice(1)) };
  const wiki = host.match(/^([a-z-]+)\.(?:m\.)?wikipedia\.org$/);
  if (wiki && parts[0] === "wiki" && parts[1]) return { kind: "wikipedia", id: parts.slice(1).join("/"), lang: wiki[1] };
  if (/\.pdf$/i.test(u.pathname)) return { kind: "pdf" };
  return { kind: "page" };
}
