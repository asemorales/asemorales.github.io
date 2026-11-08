export function setIcon(el: Element, name: string) {
  el.className = el.className.replace(/\bicon-\S+/, `icon-${name}`);
}

export function copier(target: HTMLElement, icon: Element, rest: string, getText: () => string) {
  let timer: number | undefined;
  target.addEventListener("click", async (e) => {
    e.preventDefault();
    let ok = true;
    try {
      await navigator.clipboard.writeText(getText());
    } catch {
      ok = false;
    }
    setIcon(icon, ok ? "check" : "x");
    target.dataset.copied = ok ? "true" : "false";
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      setIcon(icon, rest);
      delete target.dataset.copied;
    }, 1500);
  });
}
