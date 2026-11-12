const NBSP = " ";
const TAB = NBSP.repeat(4);

export function remarkQuoteSpacing() {
  return (tree, file) => {
    const lines = String(file.value).split(/\r?\n/);

    const indent = (source, depth, whole) => {
      const match = source.match(new RegExp(`^(?:[ \\t]*> ?){1,${depth}}([ \\t]*)`));
      if (!match || (whole && match[0].length !== source.length)) return "";
      return match[1].replaceAll(" ", NBSP).replaceAll("\t", TAB);
    };

    const space = (node, depth) => {
      if (node.type === "text" && node.position) {
        const { line, column } = node.position.start;
        node.value = node.value
          .split("\n")
          .map((part, i) => {
            const source = lines[line - 1 + i] ?? "";
            const lead = i ? indent(source, depth) : indent(source.slice(0, column - 1), depth, true);
            return lead + part.replace(/ {2,}/g, (run) => NBSP.repeat(run.length - 1) + " ");
          })
          .join("\n");
      }
      node.children?.forEach((child) => space(child, depth));
    };

    const visit = (node, depth) => {
      for (const child of node.children ?? []) {
        if (child.type === "paragraph" && node.type === "blockquote") space(child, depth);
        else visit(child, depth + (child.type === "blockquote" ? 1 : 0));
      }
    };
    visit(tree, 0);
  };
}
