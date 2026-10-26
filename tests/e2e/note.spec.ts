import { expect, test, type Locator } from "@playwright/test";

// The note page, with /lorem-ipsum/ as the fixture.
const LOREM = "/lorem-ipsum/";
const wide = (name: string) => name.startsWith("wide");
const box = async (l: Locator) => (await l.boundingBox())!;
const opacity = (l: Locator) => l.evaluate((el) => Number(getComputedStyle(el).opacity));

test.beforeEach(async ({ page }) => {
  await page.goto(LOREM);
});

test.describe("layout and type", () => {
  test("justifies and indents paragraphs that follow paragraphs", async ({ page }, info) => {
    const [first, second] = [page.locator("#typography + p"), page.locator("#typography + p + p")];
    expect(await first.evaluate((el) => getComputedStyle(el).textIndent)).toBe("0px");
    expect(await second.evaluate((el) => getComputedStyle(el).textIndent)).not.toBe("0px");
    const align = await second.evaluate((el) => getComputedStyle(el).textAlign);
    expect(align).toBe(wide(info.project.name) ? "justify" : "left");
  });

  test("draws the separator as three asterisks, with no indent after it", async ({ page }) => {
    const hr = page.locator("article hr");
    expect(await hr.evaluate((el) => getComputedStyle(el, "::after").content)).toContain("*");
    expect(await page.locator("article hr + p").evaluate((el) => getComputedStyle(el).textIndent)).toBe("0px");
  });
});

test.describe("sections", () => {
  test("numbers headings and lists them in the contents", async ({ page }) => {
    await expect(page.locator("#typography .secno")).toHaveText("1.");
    await expect(page.locator("#tables .secno")).toHaveText("1.2.");
    await expect(page.locator("#a-fourth-level-heading .secno")).toHaveText("8.1.1.");
    const toc = page.locator("nav.toc");
    await expect(toc.locator("details")).toHaveAttribute("open", "");
    for (const href of await toc.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href")!))) {
      await expect(page.locator(href)).toHaveCount(1);
    }
  });

  test("contents entries jump to their headings", async ({ page }) => {
    await page.locator("nav.toc a[href='#infobox']").click();
    await expect(page).toHaveURL(/#infobox$/);
    await expect(page.locator("#infobox")).toBeInViewport();
  });

  test("each heading links to itself", async ({ page }) => {
    await expect(page.locator("#math a.anchor")).toHaveAttribute("href", "#math");
  });

  test("heading links copy their URL", async ({ page, context, javaScriptEnabled, browserName }) => {
    test.skip(javaScriptEnabled === false || browserName !== "chromium", "Chromium with JS");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const anchor = page.locator("#math a.anchor");
    await page.locator("#math").hover();
    await anchor.click();
    await expect(anchor).toHaveAttribute("data-copied", "true");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/lorem-ipsum\/#math$/);
  });

  test("put the contents in a sticky rail left of the column on wide screens", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1200, "1200px and up");
    const column = await box(page.locator("article.note h1"));
    const toc = page.locator("nav.toc details");
    expect((await box(toc)).x + (await box(toc)).width).toBeLessThan(column.x);
    await page.locator("#infobox").scrollIntoViewIfNeeded();
    await expect(toc).toBeInViewport();
  });
});

test.describe("sidenotes", () => {
  test("sit in the right margin beside their references on wide screens", async ({ page }, info) => {
    test.skip(!wide(info.project.name), "wide screens only");
    const column = await box(page.locator("article.note"));
    const notes = page.locator(".sidenote");
    await expect(notes).toHaveCount(4);
    const boxes = await Promise.all((await notes.all()).map(box));
    for (const b of boxes) expect(b.x).toBeGreaterThan(column.x + column.width);
    // Never overlapping, even when the references are close together.
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i - 1].y + boxes[i - 1].height);
    const ref = await box(page.locator("#snref-short"));
    expect(Math.abs(boxes[0].y - ref.y)).toBeLessThan(ref.height * 2);
  });

  test("open and close on tap on phones", async ({ page }, info) => {
    test.skip(wide(info.project.name), "phones only");
    const note = page.locator("#sn-short + .sidenote");
    await expect(note).toBeHidden();
    await page.locator("#snref-short").tap();
    await expect(note).toBeVisible();
    await page.locator("#snref-short").tap();
    await expect(note).toBeHidden();
  });

  test("render a note cited twice once, with the later citation linking back", async ({ page }) => {
    await expect(page.locator(".sidenote", { hasText: "A short sidenote." })).toHaveCount(1);
    await expect(page.locator(".sidenote-ref a")).toHaveAttribute("href", "#snref-short");
    await expect(page.locator("section.footnotes")).toHaveCount(0);
  });
});

test.describe("callouts", () => {
  test("render the status notice as a box without its marker", async ({ page }) => {
    const status = page.locator("aside.status");
    await expect(status).toContainText("This page exercises every design feature");
    await expect(page.locator("article")).not.toContainText("[!");
  });

  test("put the infobox in the margin on wide screens and the column on phones", async ({ page }, info) => {
    const infobox = page.locator("aside.infobox");
    await expect(infobox.locator("dt").first()).toHaveText("Full name");
    const column = await box(page.locator("article.note"));
    const b = await box(infobox);
    if (wide(info.project.name)) expect(b.x).toBeGreaterThan(column.x + column.width);
    else expect(b.x + b.width).toBeLessThanOrEqual(column.x + column.width + 1);
  });

  test("set every quote as an epigraph, with its attribution in a footer", async ({ page }) => {
    await expect(page.locator("#epigraph + blockquote footer")).toContainText("Borges");
    expect(await page.locator("#plain-quote + blockquote").evaluate((el) => getComputedStyle(el).fontStyle)).toBe("italic");
  });

  test("set figures in the column, and wide figures across the margin on wide screens", async ({ page }, info) => {
    const figures = page.locator("article figure");
    await expect(figures).toHaveCount(4);
    await expect(figures.nth(1).locator("figcaption")).toContainText("An orbit, drawn to no scale.");
    await expect(figures.nth(0).locator("figcaption")).toHaveCount(0);
    const column = await box(page.locator("article.note"));
    const narrow = await box(figures.nth(0));
    const spanning = await box(page.locator(".wide figure").first());
    expect(narrow.width).toBeLessThanOrEqual(column.width + 1);
    if (wide(info.project.name)) expect(spanning.width).toBeGreaterThan(column.width + 100);
    else expect(spanning.width).toBeLessThanOrEqual(column.width + 1);
  });
});

test.describe("links", () => {
  test("resolve wikilinks, and leave unpublished targets as text", async ({ page }) => {
    await expect(page.getByRole("link", { name: "the math section" })).toHaveAttribute("href", "#math");
    await expect(page.locator("#internal-links + p")).toContainText("plain text: Some Private Note.");
    await expect(page.locator("article a", { hasText: "Some Private Note" })).toHaveCount(0);
  });
});

test.describe("bottom matter", () => {
  test("lists the bibliography last in the contents, and its backlinks jump to each citation", async ({ page }) => {
    await expect(page.locator("nav.toc > details > ol > li").last().locator("a")).toHaveAttribute("href", "#bibliography");
    const bib = page.locator("section.bibliography");
    await expect(bib.locator("h2#bibliography")).toContainText("Bibliography");
    const entries = bib.locator("li");
    await expect(entries).toHaveCount(7);
    await expect(entries.first().locator("a[href^='http']")).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Complexity_class");
    const back = entries.first().locator(".backrefs a");
    const target = await back.getAttribute("href");
    await expect(page.locator(target!)).toHaveAttribute("href", "https://en.wikipedia.org/wiki/Complexity_class");
  });

  test("shows tags under a label, and the last-updated date with no period", async ({ page }) => {
    await expect(page.locator(".tags-label")).toHaveText("Tags");
    await expect(page.locator("footer.bottom p", { has: page.locator("time") })).not.toHaveText(/\.$/);
    await expect(page.locator("a.tag")).toHaveAttribute("href", "/tags/test/");
    await expect(page.locator("footer.bottom time")).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
  });
});

test.describe("block buttons", () => {
  const reveal = async (block: Locator, phone: boolean) => {
    if (phone) await block.tap();
    else await block.hover();
    return block.locator(".block-tools");
  };

  test("don't appear without JS", async ({ page, javaScriptEnabled }) => {
    test.skip(javaScriptEnabled !== false, "no-JS projects only");
    await expect(page.locator(".block-tools")).toHaveCount(0);
  });

  test("copy a code block", async ({ page, context, javaScriptEnabled, browserName }, info) => {
    test.skip(javaScriptEnabled === false, "JS projects only");
    if (browserName === "chromium") await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const block = page.locator(".code-block").first();
    const tools = await reveal(block, !wide(info.project.name));
    await expect.poll(() => opacity(tools)).toBe(1);
    const copy = tools.getByRole("button", { name: "Copy code" });
    await copy.click();
    await expect(copy).toHaveAttribute("data-copied", "true");
    if (browserName === "chromium") expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^def collatz_steps/);
  });

  test("swap display math for its LaTeX source and back", async ({ page, javaScriptEnabled }, info) => {
    test.skip(javaScriptEnabled === false, "JS projects only");
    const block = page.locator(".math-block").first();
    const tools = await reveal(block, !wide(info.project.name));
    await expect.poll(() => opacity(tools)).toBe(1);
    const toggle = tools.getByRole("button", { name: "Show LaTeX source" });
    await toggle.click();
    const source = block.locator("pre.tex-source");
    await expect(source).toBeVisible();
    await expect(source).toContainText("\\label{eq:halting}");
    await expect(block.locator("mjx-container")).toBeHidden();
    await expect(tools.getByRole("button", { name: "Copy LaTeX" })).toHaveCount(1);
    // The buttons sit side by side.
    const [copy, swap] = await Promise.all([
      box(tools.getByRole("button", { name: "Copy LaTeX" })),
      box(block.getByRole("button", { name: "Show rendered math" })),
    ]);
    expect(copy.x + copy.width).toBeLessThanOrEqual(swap.x);
    await block.getByRole("button", { name: "Show rendered math" }).click();
    await expect(source).toBeHidden();
    await expect(block.locator("mjx-container")).toBeVisible();
  });
});

test.describe("screenshots", () => {
  for (const room of ["light", "dark"] as const) {
    test(`${room} room`, async ({ page }, info) => {
      await page.emulateMedia({ colorScheme: room });
      await page.goto(LOREM);
      await page.screenshot({ path: info.outputPath(`lorem-${room}.png`), fullPage: true });
    });
  }

  test("print", async ({ page, browserName }, info) => {
    test.skip(browserName !== "chromium" || !wide(info.project.name) || info.project.name.includes("nojs"), "Chromium, wide, with JS");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("#room-toggle")).toBeHidden();
    await page.pdf({ path: info.outputPath("lorem.pdf") });
    await page.screenshot({ path: info.outputPath("lorem-print.png"), fullPage: true });
  });
});
