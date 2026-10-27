import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

export const WIDTH = 1200;
export const HEIGHT = 630;
const CACHE = "node_modules/.cache/og";

const PAGE = "#191612";
const INK = "#efe6d6";
const DIM = "#9e958a";

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
    {
      name: "Source Serif 4",
      data: readFileSync("src/assets/og/source-serif-4-400-italic.ttf"),
      weight: 400,
      style: "italic",
    },
    { name: "DM Mono", data: readFileSync("src/assets/og/dm-mono.ttf"), weight: 400, style: "normal" },
  ]);

const h = (type, style, children) => ({ type, props: { style, children } });

const wordmark = (text, size) =>
  text
    .split(/(m)/)
    .filter(Boolean)
    .map((part) => (part === "m" ? h("span", { margin: `0 ${size * 0.05}px` }, part) : part));

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
      h(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          gap: 28,
          margin: "auto 0",
          alignItems: "center",
          textAlign: "center",
        },
        home
          ? [
              { type: "img", props: { src: LOGO, width: 194, height: 140, style: { marginRight: 20 } } },
              h("div", { display: "flex", fontFamily: "DM Mono", fontSize: 48, lineHeight: 1.15 }, wordmark(title, 48)),
              text
                ? h("div", { display: "block", lineClamp: 3, fontSize: 34, fontStyle: "italic", lineHeight: 1.45, color: DIM, marginTop: -16 }, text)
                : null,
            ].filter(Boolean)
          : [
              { type: "img", props: { src: LOGO, width: 138, height: 100, style: { marginRight: 14 } } },
              h("div", { display: "block", lineClamp: 2, fontSize: titleSize, fontWeight: 600, lineHeight: 1.15 }, title),
              h("div", { display: "flex", fontFamily: "DM Mono", fontSize: 26, color: DIM }, wordmark("asemorales", 26)),
            ],
      ),
    ],
  );
}

export async function ogImage({ title, text = "", home = false }) {
  const tree = layout({ title, text, home });
  const key = createHash("sha256").update(JSON.stringify(tree)).digest("hex").slice(0, 16);
  const file = join(CACHE, `${key}.png`);
  try {
    return readFileSync(file);
  } catch {}
  const svg = await satori(tree, { width: WIDTH, height: HEIGHT, fonts: loadFonts() });
  const png = new Resvg(svg).render().asPng();
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(file, png);
  return png;
}
