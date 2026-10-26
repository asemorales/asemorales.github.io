import { describe, expect, it } from "vitest";
import { rehypeMathLabels, rehypeMathSource } from "../../src/lib/rehype-math-labels.js";

const el = (tagName, properties = {}, children = []) => ({ type: "element", tagName, properties, children });
const math = (tex) => el("code", { className: ["language-math", "math-inline"] }, [{ type: "text", value: tex }]);
const rendered = (...children) => el("mjx-container", {}, [el("svg", { role: "img" }, children)]);

describe("rehypeMathLabels", () => {
  it("names each SVG with its TeX, in document order", () => {
    const file = { data: {} };
    rehypeMathSource()({ type: "root", children: [el("p", {}, [math("a\n+ b"), math("c")])] }, file);
    const [first, second] = [rendered(), rendered()];
    rehypeMathLabels()({ type: "root", children: [el("p", {}, [first, second])] }, file);
    expect(first.children[0].properties["aria-label"]).toBe("a + b");
    expect(second.children[0].properties["aria-label"]).toBe("c");
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
});
