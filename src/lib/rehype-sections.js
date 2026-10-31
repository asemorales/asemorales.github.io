import GithubSlugger from "github-slugger";
import { el, isElement, text, txt } from "./hast.js";

const LEVELS = { h2: 0, h3: 1, h4: 2 };
export const BACK_IDS = ["see-also", "references", "external-links"];

export function rehypeSections({ backlinked = [] } = {}) {
  const linked = new Set(backlinked);
  return (tree, file) => {
    const slugger = new GithubSlugger();
    for (const id of BACK_IDS) slugger.slug(id);
    const headings = [];
    for (const node of tree.children) {
      if (!isElement(node) || !(node.tagName in LEVELS)) continue;
      const depth = LEVELS[node.tagName];
      const id = node.properties.id ?? slugger.slug(text(node).trim());
      const title = unlink(structuredClone(node.children));
      node.properties.id = id;
      node.children = [
        ...node.children,
        el("a", { href: `#${id}`, className: ["anchor"], ariaLabel: `Link to section ${text(node).trim()}` }, [
          el("span", { className: ["icon", "icon-link"], ariaHidden: "true" }),
        ]),
      ];
      headings.push({ depth, id, title });
    }
    const frontmatter = file?.data.astro?.frontmatter ?? {};
    const back = [];
    if (linked.has(file?.stem)) back.push({ id: "see-also", title: "See also" });
    if (frontmatter.references?.length) back.push({ id: "references", title: "References" });
    if (frontmatter.externalLinks?.length) back.push({ id: "external-links", title: "External links" });
    if (headings.length + back.length < 2) return;
    const first = tree.children.findIndex((n) => isElement(n) && n.tagName in LEVELS);
    tree.children.splice(first === -1 ? tree.children.length : first, 0, toc(headings, back));
  };
}

function toc(headings, back) {
  const root = el("ol");
  const stack = [root];
  for (const h of headings) {
    while (stack.length > h.depth + 1) stack.pop();
    while (stack.length < h.depth + 1) {
      const parent = stack.at(-1);
      const li = parent.children.at(-1) ?? addItem(parent, []);
      const ol = el("ol");
      li.children.push(ol);
      stack.push(ol);
    }
    addItem(stack.at(-1), [el("a", { href: `#${h.id}` }, h.title)]);
  }
  for (const b of back) addItem(root, [el("a", { href: `#${b.id}` }, [txt(b.title)])]);
  return el("nav", { className: ["toc"], ariaLabel: "Contents" }, [el("details", { open: true }, [el("summary", {}, [txt("Contents")]), root])]);
}

function addItem(ol, children) {
  const li = el("li", {}, children);
  ol.children.push(li);
  return li;
}

function unlink(nodes) {
  return nodes.flatMap((n) => (isElement(n, "a") ? unlink(n.children) : isElement(n) ? [{ ...n, children: unlink(n.children) }] : [n]));
}
