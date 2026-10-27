// The Atom feed: every listed note, newest first, with its full text. See
// src/lib/feed.js for how a note's HTML is built for feed readers.
import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";
import { getCollection } from "astro:content";
import linkStatus from "../data/links-status.json";
import { feedHtml } from "../lib/feed.js";
import { summary } from "../lib/summary.js";

const AUTHOR = "Ase Morales";
const TITLE = "Ase Morales";
const SUBTITLE = "Notes on logic, complexity, and cognition.";

const images = import.meta.glob<ImageMetadata>("../content/notes/images/*", { eager: true, import: "default" });

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET({ site }: { site: URL }) {
  const origin = site.href.replace(/\/$/, "");
  const all = await getCollection("notes");
  const titles = all.map((n) => n.data.title);
  const notes = all.filter((n) => !n.data.unlisted).sort((a, b) => +b.data.date - +a.data.date);
  const urls = new Map<string, string>();
  for (const [path, meta] of Object.entries(images)) urls.set(`./images/${path.split("/").pop()}`, (await getImage({ src: meta })).src);

  const entries = await Promise.all(
    notes.map(async (n) => {
      const url = `${origin}/${n.id}/`;
      const html = await feedHtml(n.body ?? "", {
        title: n.data.title,
        slug: n.id,
        titles,
        site: origin,
        status: linkStatus,
        image: (src: string) => urls.get(src) ?? src,
      });
      const lead = summary(n.body ?? "", { paragraphs: 1 })[0] ?? "";
      return `  <entry>
    <title>${escape(n.data.title)}</title>
    <link rel="alternate" type="text/html" href="${url}"/>
    <id>${url}</id>
    <published>${n.data.date.toISOString()}</published>
    <updated>${n.data.updated.toISOString()}</updated>
    <summary>${escape(lead)}</summary>
    <content type="html">${escape(html)}</content>
${n.data.tags.map((t) => `    <category term="${escape(t)}"/>`).join("\n")}
  </entry>`;
    }),
  );
  const updated = notes.length ? new Date(Math.max(...notes.map((n) => +n.data.updated))) : new Date(0);
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${TITLE}</title>
  <subtitle>${SUBTITLE}</subtitle>
  <link rel="self" type="application/atom+xml" href="${origin}/feed.xml"/>
  <link rel="alternate" type="text/html" href="${origin}/"/>
  <id>${origin}/</id>
  <updated>${updated.toISOString()}</updated>
  <author><name>${AUTHOR}</name><uri>${origin}/</uri></author>
${entries.join("\n")}
</feed>
`;
  return new Response(xml, { headers: { "Content-Type": "application/atom+xml; charset=utf-8" } });
}
