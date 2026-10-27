import { getCollection } from "astro:content";
import { mathImageName, proofTrees, texToSvg } from "../../../lib/feed.js";

export async function getStaticPaths() {
  const notes = await getCollection("notes", (n) => !n.data.unlisted);
  const trees = new Map(notes.flatMap((n) => proofTrees(n.body ?? "")).map((tex) => [mathImageName(tex).replace(/\.svg$/, ""), tex]));
  return [...trees].map(([name, tex]) => ({ params: { name }, props: { tex } }));
}

export function GET({ props }: { props: { tex: string } }) {
  return new Response(texToSvg(props.tex), { headers: { "Content-Type": "image/svg+xml" } });
}
