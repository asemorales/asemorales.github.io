const MARK = "==";

export function remarkHighlights() {
  return (tree) => highlight(tree);
}

function highlight(node) {
  if (!node.children) return;
  node.children.forEach(highlight);
  if (!node.children.some((c) => c.type === "text" && c.value.includes(MARK))) return;
  const out = [];
  let open = null;
  for (const child of node.children) {
    if (child.type !== "text" || !child.value.includes(MARK)) {
      (open ?? out).push(child);
      continue;
    }
    child.value.split(MARK).forEach((part, i) => {
      if (i > 0) {
        if (open?.length) out.push({ type: "highlight", data: { hName: "mark" }, children: open });
        else if (open) out.push(text(MARK + MARK));
        open = open ? null : [];
      }
      if (part) (open ?? out).push(text(part));
    });
  }
  if (open) out.push(text(MARK), ...open);
  node.children = out;
}

function text(value) {
  return { type: "text", value };
}
