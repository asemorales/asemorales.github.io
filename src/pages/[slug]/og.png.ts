// Each note's social image: its title and the first sentence of its summary.
// Unlisted notes get one too, since their links can still be shared.
import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { firstSentence, ogImage } from "../../lib/og.js";
import { summary } from "../../lib/summary.js";

export async function getStaticPaths() {
  const notes = await getCollection("notes");
  return notes.map((note) => ({ params: { slug: note.id }, props: { note } }));
}

export async function GET({ props }: { props: { note: CollectionEntry<"notes"> } }) {
  const { note } = props;
  const lead = summary(note.body ?? "", { paragraphs: 1 })[0] ?? "";
  const png = await ogImage({ title: note.data.title, text: firstSentence(lead) });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
