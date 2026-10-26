import fs from "node:fs";
import path from "node:path";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import matter from "gray-matter";
import { slugify } from "./src/lib/slug.js";

const site = "https://asemorales.com";

// Unlisted notes stay out of the sitemap, as they stay off the homepage and the
// feed. So do tag pages that list no notes.
const notesDir = "src/content/notes";
const notes = fs
  .readdirSync(notesDir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => ({ url: `${site}/${f.replace(/\.md$/, "")}/`, data: matter(fs.readFileSync(path.join(notesDir, f), "utf8")).data }));
const hidden = new Set(notes.filter((n) => n.data.unlisted).map((n) => n.url));
const listedTags = new Set(notes.filter((n) => !n.data.unlisted).flatMap((n) => n.data.tags.map(slugify)));
const inSitemap = (page) => {
  const tag = page.match(/\/tags\/([^/]+)\/$/);
  return !hidden.has(page) && (!tag || listedTags.has(tag[1]));
};

export default defineConfig({
  site,
  trailingSlash: "always",
  integrations: [sitemap({ filter: inSitemap })],
  markdown: {
    shikiConfig: {
      // Both themes as CSS variables. global.css picks one per room.
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    },
  },
  vite: { plugins: [tailwindcss()] },
});
