import type { Card } from "../types";

function add(parent: HTMLElement, tag: string, className: string, text: string) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  parent.append(el);
  return el;
}

function addText(body: HTMLElement, { epigraph, paragraphs }: Pick<Card, "epigraph" | "paragraphs">) {
  if (epigraph) {
    const quote = document.createElement("blockquote");
    quote.className = "popover-epigraph";
    add(quote, "p", "", "").innerHTML = epigraph.text;
    if (epigraph.by) add(quote, "footer", "", epigraph.by);
    body.append(quote);
  }
  for (const html of paragraphs) {
    const p = document.createElement("p");
    p.innerHTML = html;
    body.append(p);
  }
}

export function fill(el: HTMLElement, card: Card, a: HTMLElement, more = true) {
  el.replaceChildren();
  if (card.dead) add(el, "p", "popover-dead", card.dead);
  const title = add(el, "p", "popover-title", card.title);
  if (card.type) {
    title.append(" ");
    add(title, "span", "term-type", card.type);
  }
  if (card.meta?.length) {
    const meta = add(el, "p", "popover-meta", "");
    meta.className = "popover-meta *:not-first:ml-2 *:not-first:border-l *:not-first:border-rule *:not-first:pl-2";
    for (const part of card.meta) add(meta, "span", "", part);
  }
  if (card.tags?.length) {
    const tags = add(el, "p", "popover-tags", "");
    for (const tag of card.tags) add(tags, "span", "tag", tag);
  }
  const body = document.createElement("div");
  body.className = "popover-body";
  addText(body, card);
  for (const section of card.sections ?? []) {
    if (section.title) add(body, "p", "definition-label", section.title);
    addText(body, section);
  }
  if (body.hasChildNodes()) el.append(body);
  const href = card.href ?? (a instanceof HTMLAnchorElement ? a.href : "");
  if (!href) return;
  const internal = new URL(href, location.href).origin === location.origin;
  if (more && (!internal || body.hasChildNodes())) {
    const more = add(el, "a", "popover-more", internal ? "Read more" : "Go to site") as HTMLAnchorElement;
    more.href = href;
    more.tabIndex = -1;
    if (!internal) more.insertAdjacentHTML("beforeend", '<span class="icon icon-external ml-1" aria-hidden="true"></span>');
  }
}
