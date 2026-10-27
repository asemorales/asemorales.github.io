// The social image every page but notes shares: the homepage, About, and tags.
import { ogImage } from "../lib/og.js";

export async function GET() {
  const png = await ogImage({ title: "asemorales", text: "On logic, complexity, and cognition", home: true });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
