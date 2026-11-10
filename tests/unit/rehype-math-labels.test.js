import { describe, expect, it } from "vitest";
import { rehypeMathLabels, rehypeMathSource } from "../../src/lib/rehype-math-labels.js";

const el = (tagName, properties = {}, children = []) => ({ type: "element", tagName, properties, children });
const math = (tex) => el("code", { className: ["language-math", "math-inline"] }, [{ type: "text", value: tex }]);
const rendered = (...children) => el("mjx-container", {}, [el("svg", { role: "img" }, children)]);

describe("rehypeMathLabels", () => {
  it("hides each SVG behind MathML, in document order", () => {
    const file = { data: {} };
    rehypeMathSource()({ type: "root", children: [el("p", {}, [math("a\n+ b"), math("c")])] }, file);
    const [first, second] = [rendered(), rendered()];
    rehypeMathLabels()({ type: "root", children: [el("p", {}, [first, second])] }, file);
    expect(first.children[0].properties.ariaHidden).toBe("true");
    expect(first.children[1].children[0].value).toContain("<mi>a</mi>");
    expect(second.children[1].children[0].value).toContain("<mi>c</mi>");
  });

  it("names the link in place of an SVG that holds one", () => {
    const file = { data: {} };
    rehypeMathSource()({ type: "root", children: [math("\\eqref{x}")] }, file);
    const link = el("a", { href: "#x" });
    const container = rendered(el("g", {}, [link]));
    rehypeMathLabels()({ type: "root", children: [container] }, file);
    expect(container.children[0].properties).toEqual({});
    expect(link.properties["aria-label"]).toBe("\\eqref{x}");
  });

  it("records the width of wide math so CSS can shrink it", () => {
    const file = { data: {} };
    rehypeMathSource()({ type: "root", children: [math("a"), math("b"), math("c")] }, file);
    const narrow = el("mjx-container", {}, [el("svg", { width: "5ex" })]);
    const wide = el("mjx-container", {}, [el("svg", { width: "25.5ex" })]);
    const full = el("mjx-container", { display: "true", width: "full", style: "min-width: 30ex;" }, [el("svg", { width: "100%" })]);
    rehypeMathLabels()({ type: "root", children: [narrow, wide, full] }, file);
    expect([narrow, wide, full].map((n) => n.properties.style)).toEqual([undefined, "--w:25.5;", "min-width: 30ex;--w:30;"]);
  });
});
