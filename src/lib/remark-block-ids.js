const TRAILING = /\s\^([a-z0-9-]+)\s*$/i;
const ALONE = /^\s*\^([a-z0-9-]+)\s*$/i;

export function remarkBlockIds() {
  return (tree) => assign(tree);
}

function assign(node) {
  if (!node.children) return;
  const kept = [];
  for (const child of node.children) {
    assign(child);
    const alone =
      child.type === "paragraph" && child.children.length === 1 && child.children[0].type === "text" && child.children[0].value.match(ALONE);
    if (alone && kept.length) {
      setId(kept.at(-1), alone[1]);
      continue;
    }
    const last = child.type === "paragraph" ? child.children.at(-1) : null;
    const trailing = last?.type === "text" && last.value.match(TRAILING);
    if (trailing) {
      last.value = last.value.slice(0, trailing.index);
      setId(node.type === "listItem" ? node : child, trailing[1]);
    }
    kept.push(child);
  }
  node.children = kept;
}

function setId(node, id) {
  node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id: id.toLowerCase() } };
}
