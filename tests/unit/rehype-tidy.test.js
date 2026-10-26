import { describe, expect, it } from "vitest";
import { rehypeTidy } from "../../src/lib/rehype-tidy.js";

const el = (tagName, properties = {}, children = []) => ({ type: "element", tagName, properties, children });

describe("rehypeTidy", () => {
  it("moves table cell alignment into style", () => {
    const cell = el("td", { align: "right" });
    rehypeTidy()({ type: "root", children: [el("table", {}, [el("tr", {}, [cell])])] });
    expect(cell.properties).toEqual({ style: "text-align: right" });
  });

  it("drops style elements, including nested ones", () => {
    const article = el("article", {}, [el("style"), el("p", {}, [el("style")])]);
    rehypeTidy()({ type: "root", children: [article] });
    expect(article.children.map((c) => c.tagName)).toEqual(["p"]);
    expect(article.children[0].children).toEqual([]);
  });
});
