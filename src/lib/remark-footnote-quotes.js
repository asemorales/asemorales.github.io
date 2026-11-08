export function remarkFootnoteQuotes() {
  return (tree) => {
    const out = [];
    for (const node of tree.children) {
      const previous = out.at(-1);
      const quote = previous?.type === "footnoteDefinition" ? previous.children.at(-1) : null;
      if (node.type === "blockquote" && quote?.type === "blockquote" && quote.position.end.line + 1 === node.position.start.line) {
        quote.children.push(...node.children);
      } else {
        out.push(node);
      }
    }
    tree.children = out;
  };
}
