function reveal(hash: string) {
  const target = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  const details = target?.closest<HTMLDetailsElement>(".note details:not([open])");
  if (details && !details.querySelector("summary")!.contains(target)) details.open = true;
}
document.addEventListener("click", (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>("a[href^='#']");
  if (a) reveal(a.hash);
});
if (location.hash) {
  reveal(location.hash);
  document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
}

let collapsed: HTMLDetailsElement[] = [];
addEventListener("beforeprint", () => {
  collapsed = [...document.querySelectorAll<HTMLDetailsElement>(".note details:not([open])")];
  for (const d of collapsed) d.open = true;
});
addEventListener("afterprint", () => {
  for (const d of collapsed) d.open = false;
});
