import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { rehypeDeadLinks } from "./dead-links.js";
import { classes, el, isElement, text, txt, walk } from "./hast.js";
import { isProofTree, mathImageName, resetMathTags, texToMathml } from "./math.js";
import { rehypeCallouts } from "./rehype-callouts.js";
import { rehypeFigures } from "./rehype-figures.js";
import { remarkFootnoteQuotes } from "./remark-footnote-quotes.js";
import { remarkWikilinks } from "./wikilinks.js";

function rehypeFeedMath({ site }) {
  return (tree) => {
    resetMathTags();
    walk(tree, (node, parent) => {
      const display = isElement(node, "pre") && node.children.some((c) => isElement(c, "code") && classes(c).includes("math-display"));
      const inline = isElement(node, "code") && classes(node).includes("math-inline");
      if (!display && !inline) return false;
      const tex = text(node).trim();
      const i = parent.children.indexOf(node);
      if (display && isProofTree(tex)) {
        parent.children[i] = el("p", {}, [el("img", { src: `${site}/feed/math/${mathImageName(tex)}`, alt: tex })]);
      } else {
        parent.children[i] = { type: "raw", value: texToMathml(tex, display) };
      }
      return true;
    });
  };
}

function rehypeFeedTidy({ site, base, image }) {
  return (tree) => {
    const tidy = (node) => {
      if (!node.children) return;
      node.children = node.children.flatMap((child) => {
        if (!isElement(child)) return [child];
        tidy(child);
        if (isElement(child, "aside")) return [el("blockquote", {}, child.children)];
        if (isElement(child, "div") && classes(child).includes("wide")) return child.children;
        delete child.properties.className;
        delete child.properties.ariaLabel;
        delete child.properties.dataDeadSince;
        for (const attr of ["href", "src"]) {
          const v = child.properties[attr];
          if (typeof v !== "string") continue;
          if (attr === "src" && v.startsWith("./")) child.properties.src = new URL(image(v), site).href;
          else if (v.startsWith("#")) child.properties[attr] = `${base}${v}`;
          else if (v.startsWith("/")) child.properties[attr] = `${site}${v}`;
        }
        return [child];
      });
    };
    tidy(tree);
  };
}

function rehypeFeedFootnotes() {
  return (tree) => {
    walk(tree, (node, parent) => {
      const i = parent.children.indexOf(node);
      if (isElement(node, "h2") && node.properties.id === "footnote-label") node.children = [txt("Notes")];
      else if (node.properties.dataFootnoteRef !== undefined) parent.children[i] = txt(text(node));
      else if (node.properties.dataFootnoteBackref !== undefined) parent.children.splice(i, 1);
      else if (isElement(node, "li")) delete node.properties.id;
      return false;
    });
  };
}

export async function feedHtml(markdown, { slug, slugs, site, status = {}, image = (src) => src }) {
  const base = `${site}/${slug}/`;
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFootnoteQuotes)
    .use(remarkMath)
    .use(remarkWikilinks, { slugs })
    .use(remarkRehype)
    .use(rehypeFeedMath, { site })
    .use(rehypeCallouts)
    .use(rehypeFigures)
    .use(rehypeFeedFootnotes)
    .use(rehypeDeadLinks, { status })
    .use(rehypeFeedTidy, { site, base, image })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return String(file);
}
