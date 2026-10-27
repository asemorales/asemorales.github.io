// Numbers a note's sections (1., 1.1., 1.1.1.), gives each heading an id and a
// link to it, which JS turns into a copy button, and puts a table of contents
// before the first heading. The contents end with the page's back matter, See
// also, References, and External links, unnumbered, when the note has them:
// See also when another published note links here (`backlinked` lists those
// notes' titles), and the other two when rehypeBibliography filled them.
//
// Ids come from the heading's text alone, so they match the slugs wikilinks use
// for [[Note#Heading]], and stay put when sections are renumbered.
import GithubSlugger from "github-slugger";
import { el, isElement, text, txt } from "./hast.js";

const LEVELS = { h2: 0, h3: 1, h4: 2 };
export const BACK_IDS = ["see-also", "references", "external-links"];

export function rehypeSections({ backlinked = [] } = {}) {
  const linked = new Set(backlinked.map((t) => t.toLowerCase()));
  return (tree, file) => {
    // The back matter's ids are taken, so a heading named "References" gets
    // "references-1".
    const slugger = new GithubSlugger();
    for (const id of BACK_IDS) slugger.slug(id);
    const counts = [0, 0, 0];
    const headings = [];
    for (const node of tree.children) {
      if (!isElement(node) || !(node.tagName in LEVELS)) continue;
      const depth = LEVELS[node.tagName];
      counts[depth]++;
      counts.fill(0, depth + 1);
      const number = counts.slice(0, depth + 1).join(".");
      const id = node.properties.id ?? slugger.slug(text(node).trim());
      const title = unlink(structuredClone(node.children));
      node.properties.id = id;
      node.children = [
        el("span", { className: ["secno"] }, [txt(`${number}.`)]),
        txt(" "),
        ...node.children,
        el("a", { href: `#${id}`, className: ["anchor"], ariaLabel: `Link to section ${number}` }, [
          el("span", { className: ["icon", "icon-link"], ariaHidden: "true" }),
        ]),
      ];
      headings.push({ depth, number, id, title });
    }
    const frontmatter = file?.data.astro?.frontmatter ?? {};
    const back = [];
    if (linked.has(String(frontmatter.title).toLowerCase())) back.push({ id: "see-also", title: "See also" });
    if (frontmatter.references?.length) back.push({ id: "references", title: "References" });
    if (frontmatter.externalLinks?.length) back.push({ id: "external-links", title: "External links" });
    if (headings.length + back.length < 2) return;
    const first = tree.children.findIndex((n) => isElement(n) && n.tagName in LEVELS);
    tree.children.splice(first === -1 ? tree.children.length : first, 0, toc(headings, back));
  };
}

// Nested lists, one level per heading depth, then the back matter.
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
    addItem(stack.at(-1), [el("a", { href: `#${h.id}` }, [el("span", { className: ["secno"] }, [txt(`${h.number}.`)]), txt(" "), ...h.title])]);
  }
  for (const b of back) addItem(root, [el("a", { href: `#${b.id}` }, [txt(b.title)])]);
  return el("nav", { className: ["toc"], ariaLabel: "Contents" }, [el("details", { open: true }, [el("summary", {}, [txt("Contents")]), root])]);
}

function addItem(ol, children) {
  const li = el("li", {}, children);
  ol.children.push(li);
  return li;
}

// A heading's links can't sit inside the contents' links, so keep their text.
function unlink(nodes) {
  return nodes.flatMap((n) => (isElement(n, "a") ? unlink(n.children) : isElement(n) ? [{ ...n, children: unlink(n.children) }] : [n]));
}
