import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Both collections are written by `npm run sync` from the vault's published/
// folder. Edit the vault, not these files.
const notes = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date(),
    tags: z.array(z.string()).min(1),
    unlisted: z.boolean().default(false),
  }),
});

// One per annotated external link. They feed popovers and never become pages.
const annotations = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/annotations" }),
  schema: z.object({ url: z.url() }),
});

export const collections = { notes, annotations };
