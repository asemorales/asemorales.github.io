// Open Graph images: the logo, a title, and one sentence on the dark room's page, drawn
// by satori as SVG and turned into a 1200 × 630 PNG by resvg. Images are
// cached by a hash of everything drawn, so unchanged ones aren't redrawn.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { clip } from "./summary.js";

export const WIDTH = 1200;
export const HEIGHT = 630;
const CACHE = "node_modules/.cache/og";

// The dark room's tokens from global.css.
const PAGE = "#191612";
const INK = "#efe6d6";
const DIM = "#9e958a";
const RULE = "#4d463e";

// The favicon's glyph without its box, in ink, cropped so its left edge lines
// up with the title's.
const LOGO = `data:image/svg+xml;base64,${Buffer.from(
  readFileSync("public/favicon.svg", "utf8")
    .replace(/<style>[\s\S]*<\/style>/, "")
    .replace(/<rect[^>]*\/>/, "")
    .replace('viewBox="0 0 70 70"', 'viewBox="7.4 14.7 55.8 40.3"')
    .replace('class="glyph"', `fill="${INK}"`),
).toString("base64")}`;

let fonts;
const loadFonts = () =>
  (fonts ??= [
    ...[400, 600].map((weight) => ({
      name: "Source Serif 4",
      data: readFileSync(`src/assets/og/source-serif-4-${weight}.ttf`),
      weight,
      style: "normal",
    })),
    { name: "DM Mono", data: readFileSync("src/assets/og/dm-mono.ttf"), weight: 400, style: "normal" },
  ]);

// The first sentence of a summary paragraph, clipped. Satori can't draw math,
// so inline TeX loses its dollar signs and keeps its source.
export function firstSentence(text) {
  const plain = text.replace(/\$([^$\n]+)\$/g, "$1");
  const match = plain.match(/^.*?[.!?](?=\s|$)/);
  return clip(match ? match[0] : plain, 180);
}

const h = (type, style, children) => ({ type, props: { style, children } });

// DM Mono's m nearly fills its cell, crowding its neighbours, so each m is
// padded by about the space it lacks.
const wordmark = (text, size) =>
  text
    .split(/(m)/)
    .filter(Boolean)
    .map((part) => (part === "m" ? h("span", { margin: `0 ${size * 0.05}px` }, part) : part));

// The title takes at most two lines and the sentence at most three, or two
// under a title long enough to wrap, so the footer stays on the canvas. The
// homepage's image centres everything, sets the title as the footer's mono
// wordmark, and drops the footer.
function layout({ title, text, home }) {
  const titleSize = title.length > 60 ? 52 : title.length > 30 ? 62 : 72;
  return h(
    "div",
    {
      width: "100%",
      height: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      padding: "72px 88px",
      backgroundColor: PAGE,
      color: INK,
      fontFamily: "Source Serif 4",
    },
    [
      // Auto margins split the free space above and below the logo and words.
      h(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          gap: 28,
          margin: "auto 0",
          ...(home && { alignItems: "center", textAlign: "center" }),
        },
        [
          // The A's weight sits right of the glyph's centre, so the homepage's
          // centred logo moves left to look centred.
          {
            type: "img",
            props: home ? { src: LOGO, width: 194, height: 140, style: { marginRight: 20 } } : { src: LOGO, width: 138, height: 100 },
          },
          home
            ? h("div", { display: "flex", fontFamily: "DM Mono", fontSize: 48, lineHeight: 1.15 }, wordmark(title, 48))
            : h("div", { display: "block", lineClamp: 2, fontSize: titleSize, fontWeight: 600, lineHeight: 1.15 }, title),
          text ? h("div", { display: "block", lineClamp: title.length > 20 ? 2 : 3, fontSize: 34, lineHeight: 1.45, color: DIM }, text) : null,
        ].filter(Boolean),
      ),
      home
        ? null
        : h(
            "div",
            { display: "flex", borderTop: `2px solid ${RULE}`, paddingTop: 24, fontFamily: "DM Mono", fontSize: 26, color: DIM },
            wordmark("asemorales", 26),
          ),
    ].filter(Boolean),
  );
}

export async function ogImage({ title, text = "", home = false }) {
  const tree = layout({ title, text, home });
  const key = createHash("sha256").update(JSON.stringify(tree)).digest("hex").slice(0, 16);
  const file = join(CACHE, `${key}.png`);
  try {
    return readFileSync(file);
  } catch {
    // Not drawn yet.
  }
  const svg = await satori(tree, { width: WIDTH, height: HEIGHT, fonts: loadFonts() });
  const png = new Resvg(svg).render().asPng();
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(file, png);
  return png;
}
