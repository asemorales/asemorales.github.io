import { touchIcon } from "../lib/og.js";

export function GET() {
  return new Response(new Uint8Array(touchIcon()), { headers: { "Content-Type": "image/png" } });
}
