import fs from "node:fs";
import path from "node:path";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import matter from "gray-matter";
import rehypeMathjax from "rehype-mathjax/svg";
import remarkMath from "remark-math";
import linkStatus from "./src/data/links-status.json" with { type: "json" };
import { rehypeDeadLinks } from "./src/lib/dead-links.js";
import { rehypeBibliography } from "./src/lib/rehype-bibliography.js";
import { rehypeBlocks } from "./src/lib/rehype-blocks.js";
import { rehypeCallouts } from "./src/lib/rehype-callouts.js";
import { rehypeFigures } from "./src/lib/rehype-figures.js";
import { rehypeMathLabels, rehypeMathSource } from "./src/lib/rehype-math-labels.js";
import { rehypeSections } from "./src/lib/rehype-sections.js";
import { rehypeSidenotes } from "./src/lib/rehype-sidenotes.js";
import { rehypeTidy } from "./src/lib/rehype-tidy.js";
import { slugify } from "./src/lib/slug.js";
import { linkTargets, remarkWikilinks } from "./src/lib/wikilinks.js";
import bierstadtDark from "./src/styles/shiki/bierstadt-dark.json" with { type: "json" };
import bierstadtLight from "./src/styles/shiki/bierstadt-light.json" with { type: "json" };

const site = "https://asemorales.com";

const notesDir = "src/content/notes";
const notes = fs
  .readdirSync(notesDir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => ({ url: `${site}/${f.replace(/\.md$/, "")}/`, ...matter(fs.readFileSync(path.join(notesDir, f), "utf8")) }));
const hidden = new Set(notes.filter((n) => n.data.unlisted).map((n) => n.url));
const listedTags = new Set(notes.filter((n) => !n.data.unlisted).flatMap((n) => n.data.tags.map(slugify)));
const unlistedTitles = new Set(notes.filter((n) => n.data.unlisted).map((n) => n.data.title.toLowerCase()));
const backlinked = notes.flatMap((n) =>
  linkTargets(n.content).filter((t) => t.toLowerCase() !== n.data.title.toLowerCase() && (!n.data.unlisted || unlistedTitles.has(t.toLowerCase()))),
);
const inSitemap = (page) => {
  const tag = page.match(/\/tags\/([^/]+)\/$/);
  return !hidden.has(page) && (!tag || listedTags.has(tag[1]));
};

export default defineConfig({
  site,
  trailingSlash: "always",
  // About moved to the foot of the homepage. Old links land there.
  redirects: { "/about": "/#about" },
  integrations: [sitemap({ filter: inSitemap })],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath, [remarkWikilinks, { titles: notes.map((n) => n.data.title) }]],
      rehypePlugins: [
        rehypeMathSource,
        [rehypeMathjax, { tex: { tags: "ams" } }],
        rehypeMathLabels,
        rehypeTidy,
        rehypeCallouts,
        rehypeFigures,
        rehypeSidenotes,
        rehypeBlocks,
        rehypeBibliography,
        [rehypeSections, { backlinked }],
        [rehypeDeadLinks, { status: linkStatus }],
      ],
    }),
    shikiConfig: {
      themes: { light: bierstadtLight, dark: bierstadtDark },
      defaultColor: false,
    },
  },
  vite: { plugins: [tailwindcss()] },
});
