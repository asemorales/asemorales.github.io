const eqHref = (a: Element) => decodeURIComponent(a.getAttribute("href")!.slice(1));
function equation(target: EventTarget | null) {
  const el = (target as Element | null)?.closest?.(".note a[href^='#mjx-eqn'], .note .math-block");
  if (!el) return null;
  const block = el.matches(".math-block") ? el : document.getElementById(eqHref(el))?.closest(".math-block");
  const ids = [...(block?.querySelectorAll("[id^='mjx-eqn']") ?? [])].map((e) => e.id);
  if (!ids.length) return null;
  const refs = [...document.querySelectorAll(".note a[href^='#mjx-eqn']")].filter((a) => ids.includes(eqHref(a)));
  return [block!, ...refs.map((a) => a.closest("mjx-container")!)];
}
function sidenote(target: EventTarget | null) {
  const el = (target as Element | null)?.closest?.(".note .sidenote-number, .note .sidenote-ref, .note .sidenote");
  if (!el) return null;
  const label = el.matches(".sidenote-ref")
    ? document.getElementById(decodeURIComponent(el.querySelector("a")!.hash.slice(1)))
    : el.matches(".sidenote")
      ? el.previousElementSibling?.previousElementSibling
      : el;
  if (!label?.matches(".sidenote-number")) return null;
  const ref = CSS.escape(label.id);
  return [label, label.nextElementSibling!.nextElementSibling!, ...document.querySelectorAll(`.note .sidenote-ref:has(a[href="#${ref}"])`)];
}
function figure(target: EventTarget | null) {
  const caption = (target as Element | null)?.closest?.(".note figcaption");
  return caption ? [caption, ...caption.parentElement!.querySelectorAll(":scope > img")] : null;
}
const group = (target: EventTarget | null) => sidenote(target) ?? equation(target) ?? figure(target);
function highlight(els: Element[] | null, on: boolean) {
  for (const el of els ?? []) el.classList.toggle("highlighted", on);
}
let pinned: Element[] | null = null;
document.addEventListener("pointerover", (e) => highlight(group(e.target), true));
document.addEventListener("pointerout", (e) => {
  const g = group(e.target);
  if (g && g[0] !== pinned?.[0] && group(e.relatedTarget)?.[0] !== g[0]) highlight(g, false);
});
document.addEventListener("click", (e) => {
  if ((e.target as Element).matches(".note .margin-toggle")) return;
  const g = group(e.target);
  if (pinned && pinned[0] !== g?.[0]) {
    highlight(pinned, false);
    pinned = null;
  }
  if (!g || (e.target as Element).closest(".block-tools")) return;
  pinned = g;
  highlight(g, true);
});
