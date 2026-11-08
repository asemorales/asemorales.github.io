import fs from "node:fs";
import path from "node:path";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import matter from "gray-matter";
import rehypeMathjax from "rehype-mathjax/svg";
import remarkMath from "remark-math";
import { day } from "./src/lib/date.js";
import linkStatus from "./src/data/links-status.json" with { type: "json" };
import { rehypeDeadLinks } from "./src/lib/dead-links.js";
import { rehypeGlossary } from "./src/lib/glossary.js";
import { rehypeBibliography } from "./src/lib/rehype-bibliography.js";
import { rehypeBlocks } from "./src/lib/rehype-blocks.js";
import { rehypeCallouts } from "./src/lib/rehype-callouts.js";
import { rehypeFigures } from "./src/lib/rehype-figures.js";
import { rehypeInlineMarks } from "./src/lib/rehype-inline-marks.js";
import { rehypeMathLabels, rehypeMathSource } from "./src/lib/rehype-math-labels.js";
import { rehypeSections } from "./src/lib/rehype-sections.js";
import { rehypeSidenotes } from "./src/lib/rehype-sidenotes.js";
import { rehypeTidy } from "./src/lib/rehype-tidy.js";
import { remarkFootnoteQuotes } from "./src/lib/remark-footnote-quotes.js";
import { SITE_URL as site } from "./src/lib/site.js";
import { slugify } from "./src/lib/slug.js";
import { notesWithSeeAlso, remarkWikilinks } from "./src/lib/wikilinks.js";
import bierstadtDark from "./src/styles/shiki/bierstadt-dark.json" with { type: "json" };
import bierstadtLight from "./src/styles/shiki/bierstadt-light.json" with { type: "json" };

const notesDir = "src/content/notes";
const notes = fs
  .readdirSync(notesDir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => ({ slug: f.replace(/\.md$/, ""), ...matter(fs.readFileSync(path.join(notesDir, f), "utf8")) }));
const listedTags = new Set(notes.filter((n) => !n.data.unlisted).flatMap((n) => n.data.tags.map(slugify)));
const seeAlso = notesWithSeeAlso(notes.map((n) => ({ id: n.slug, body: n.content })));
const testPages = new Set(notes.filter((n) => n.data.tags.includes("test")).map((n) => `${site}/${n.slug}/`));
const inSitemap = (page) => {
  if (testPages.has(page)) return false;
  const tag = page.match(/\/tags\/([^/]+)\/$/);
  return !tag || listedTags.has(tag[1]);
};

const updated = new Map(notes.map((n) => [`${site}/${n.slug}/`, day(new Date(n.data.updated))]));
const serialize = (item) => ({ ...item, lastmod: updated.get(item.url) });

export default defineConfig({
  site,
  trailingSlash: "always",
  redirects: { "/about": "/#introduction" },
  integrations: [sitemap({ filter: inSitemap, serialize })],
  image: { layout: "constrained" },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkFootnoteQuotes, remarkMath, [remarkWikilinks, { slugs: notes.map((n) => n.slug) }]],
      rehypePlugins: [
        rehypeMathSource,
        [rehypeMathjax, { tex: { tags: "ams" } }],
        rehypeMathLabels,
        rehypeTidy,
        rehypeCallouts,
        rehypeFigures,
        rehypeSidenotes,
        rehypeBlocks,
        rehypeInlineMarks,
        rehypeBibliography,
        rehypeGlossary,
        [rehypeSections, { seeAlso }],
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
