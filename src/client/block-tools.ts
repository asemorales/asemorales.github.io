import { copier, setIcon } from "./copier";

function tools(block: HTMLElement) {
  let bar = block.querySelector<HTMLElement>(":scope > .block-tools");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "block-tools";
    block.append(bar);
  }
  return bar;
}

function button(block: HTMLElement, icon: string, title: string) {
  const b = document.createElement("button");
  b.type = "button";
  b.title = title;
  b.setAttribute("aria-label", title);
  const i = document.createElement("span");
  i.className = `icon icon-${icon}`;
  i.setAttribute("aria-hidden", "true");
  b.append(i);
  tools(block).append(b);
  return b;
}

function addCopy(block: HTMLElement) {
  const b = button(block, "copy", "Copy code");
  copier(b, b.firstElementChild!, "copy", () => (block.querySelector("pre")?.textContent ?? "").replace(/\n$/, ""));
}

function addMath(block: HTMLElement) {
  const tex = block.dataset.tex;
  const math = block.querySelector<HTMLElement>("mjx-container");
  if (!tex || !math) return;
  if (navigator.clipboard) {
    const copy = button(block, "copy", "Copy LaTeX");
    copier(copy, copy.firstElementChild!, "copy", () => tex);
  }
  const b = button(block, "code", "Show LaTeX source");
  b.setAttribute("aria-pressed", "false");
  let source: HTMLElement | null = null;
  b.addEventListener("click", () => {
    if (!source) {
      source = document.createElement("pre");
      source.className = "astro-code tex-source";
      source.tabIndex = 0;
      const code = document.createElement("code");
      code.textContent = tex;
      source.append(code);
      source.hidden = true;
      math.after(source);
    }
    const showing = !source.hidden;
    source.hidden = showing;
    math.hidden = !showing;
    b.setAttribute("aria-pressed", String(!showing));
    b.title = showing ? "Show LaTeX source" : "Show rendered math";
    b.setAttribute("aria-label", b.title);
    setIcon(b.firstElementChild!, showing ? "code" : "sigma");
  });
}

function addLink(anchor: HTMLAnchorElement) {
  anchor.title = "Copy link to section";
  anchor.setAttribute("aria-label", anchor.getAttribute("aria-label")!.replace(/^Link/, "Copy link"));
  copier(anchor, anchor.querySelector(".icon")!, "link", () => anchor.href);
}

if (navigator.clipboard) {
  for (const block of document.querySelectorAll<HTMLElement>(".note .code-block")) addCopy(block);
  for (const a of document.querySelectorAll<HTMLAnchorElement>(".note a.anchor")) addLink(a);
}
for (const block of document.querySelectorAll<HTMLElement>(".note .math-block")) addMath(block);

document.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "touch") return;
  const target = (e.target as Element).closest<HTMLElement>(".code-block, .math-block");
  for (const block of document.querySelectorAll(".note .show")) if (!block.contains(target)) block.classList.remove("show");
  target?.classList.add("show");
});
