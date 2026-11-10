import { ogImage } from "../lib/og.js";
import { HANDLE } from "../lib/site.js";

export async function GET() {
  const png = await ogImage({ title: HANDLE, home: true });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
}
