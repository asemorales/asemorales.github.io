import { ogImage } from "../lib/og.js";

export async function GET() {
  const png = await ogImage({ title: "asemorales", home: true });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
