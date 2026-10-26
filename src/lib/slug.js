// A note's URL slug comes from its Obsidian file name, so "Lorem Ipsum" lives at
// /lorem-ipsum/. Wikilinks resolve through the same function.
export function slugify(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
