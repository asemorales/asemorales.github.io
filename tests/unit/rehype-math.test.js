import { describe, expect, it } from "vitest";
import { rehypeMath } from "../../src/lib/rehype-math.js";

const el = (tagName, properties = {}, children = []) => ({ type: "element", tagName, properties, children });
const inline = (tex) => el("code", { className: ["language-math", "math-inline"] }, [{ type: "text", value: tex }]);
const display = (tex) => el("pre", {}, [el("code", { className: ["language-math", "math-display"] }, [{ type: "text", value: tex }])]);
const svgs = (container) => container.children.filter((c) => c.tagName === "svg");

function run(...children) {
  const tree = { type: "root", children };
  rehypeMath()(tree, { data: {}, message() {} });
  return tree.children;
}

describe("rehypeMath", () => {
  it("hides each SVG behind MathML of its own TeX", () => {
    const [first, second] = run(inline("a\n+ b"), inline("c"));
    expect(svgs(first)[0].properties.ariaHidden).toBe("true");
    expect(first.children.at(-1).children[0].value).toContain("<mi>a</mi>");
    expect(second.children.at(-1).children[0].value).toContain("<mi>c</mi>");
  });

  it("names the link in place of an SVG that holds one", () => {
    const [, ref] = run(display("x \\label{x}"), inline("\\eqref{x}"));
    const links = [];
    const find = (n) => (n.tagName === "a" ? links.push(n) : n.children?.forEach(find));
    find(ref);
    expect(svgs(ref)[0].properties.role).toBeUndefined();
    expect(links[0].properties["aria-label"]).toBe("\\eqref{x}");
  });

  it("splits long inline math at operators, keeps short math whole, and records widths that need shrinking", () => {
    const [short, long, unbreakable] = run(
      inline("n + 1"),
      inline("a + b + c + d + e + f + g + h"),
      inline("\\text{an unbreakable stretch of text in math}"),
    );
    expect(svgs(short)).toHaveLength(1);
    expect(svgs(long).length).toBeGreaterThan(1);
    expect(long.properties.style).toBeUndefined();
    expect(unbreakable.properties.style).toMatch(/^--w:[\d.]+;$/);
  });

  it("adds a line-broken copy of wide display math without repeating its anchors", () => {
    const [narrow, wide] = run(
      display("x = y"),
      display("\\begin{align} & PLUS[(a,b),(c,d)]=(a\\times d+b\\times c,\\;b\\times d) \\label{p} \\end{align}"),
    );
    expect(svgs(narrow)).toHaveLength(1);
    const [full, broken] = svgs(wide);
    expect(broken.properties.dataNarrow).toBe("");
    expect(wide.properties.style).toMatch(/--w:([\d.]+);--wide:([\d.]+);$/);
    const [, w, wideW] = wide.properties.style.match(/--w:([\d.]+);--wide:([\d.]+);$/).map(Number);
    expect(w).toBeLessThanOrEqual(32);
    expect(wideW).toBeGreaterThan(32);
    expect(JSON.stringify(full)).toContain('"id":"mjx-eqn:p"');
    expect(JSON.stringify(broken)).not.toContain("mjx-eqn");
  });
});
