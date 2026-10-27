import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import { ogImage } from "../../lib/og.js";

export async function getStaticPaths() {
  const notes = await getCollection("notes");
  return notes.map((note) => ({ params: { slug: note.id }, props: { note } }));
}

export async function GET({ props }: { props: { note: CollectionEntry<"notes"> } }) {
  const png = await ogImage({ title: props.note.data.title });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
