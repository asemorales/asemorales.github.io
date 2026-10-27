import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

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

const annotations = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/annotations" }),
  schema: z.object({ url: z.url() }),
});

export const collections = { notes, annotations };
