import { expect, test, type Locator } from "@playwright/test";

const LOREM = "/lorem-ipsum/";
const wide = (name: string) => name.startsWith("wide");
const box = async (l: Locator) => (await l.boundingBox())!;
const opacity = (l: Locator) => l.evaluate((el) => Number(getComputedStyle(el).opacity));

test.beforeEach(async ({ page }) => {
  await page.goto(LOREM);
});

test.describe("layout and type", () => {
  test("wraps and indents every paragraph, with space between them", async ({ page, browserName }) => {
    const [first, second] = [page.locator("#typography + p"), page.locator("#typography + p + p")];
    expect(await first.evaluate((el) => getComputedStyle(el).textIndent)).not.toBe("0px");
    expect(await second.evaluate((el) => getComputedStyle(el).textIndent)).not.toBe("0px");
    expect(await second.evaluate((el) => getComputedStyle(el).marginTop)).not.toBe("0px");
    if (browserName === "chromium") expect(await second.evaluate((el) => getComputedStyle(el).textWrap)).toContain("pretty");
  });

  test("keeps long inline code inside the column", async ({ page }) => {
    const code = page.locator("article code.long").first();
    const column = await box(page.locator("article.note"));
    const b = await box(code);
    expect(b.x + b.width).toBeLessThanOrEqual(column.x + column.width + 1);
  });

  test("draws the separator as three asterisks", async ({ page }) => {
    const hr = page.locator("article hr");
    expect(await hr.evaluate((el) => getComputedStyle(el, "::after").content)).toContain("*");
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
    await expect(notes).toHaveCount(5);
    const boxes = await Promise.all((await notes.all()).map(box));
    for (const b of boxes) expect(b.x).toBeGreaterThan(column.x + column.width);
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
    await expect(page.locator(".sidenote-ref a")).toHaveText("[a]");
    await expect(page.locator("#snref-short")).toContainText("[a]");
    await expect(page.locator("section.footnotes")).toHaveCount(0);
  });

  test("highlight with their markers on hover, and after a click until the next click elsewhere", async ({ page, javaScriptEnabled }, info) => {
    test.skip(javaScriptEnabled === false || !wide(info.project.name), "wide screens with JS");
    const parts = [page.locator("#snref-short"), page.locator("#sn-short + .sidenote"), page.locator(".sidenote-ref:has(a[href='#snref-short'])")];
    const lit = async (on: boolean) => {
      for (const p of parts) await (on ? expect(p).toHaveClass(/highlighted/) : expect(p).not.toHaveClass(/highlighted/));
    };
    const corner = [page.viewportSize()!.width - 2, 2] as const;
    await parts[1].hover();
    await lit(true);
    await page.mouse.move(...corner);
    await lit(false);
    await parts[0].scrollIntoViewIfNeeded();
    const b = await box(parts[0]);
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.move(...corner);
    await lit(true);
    await page.mouse.click(...corner);
    await lit(false);
  });

  test("mark citations with numbers, reusing a source's number, inside sidenotes too", async ({ page }) => {
    const markers = page.locator(".cite-ref a");
    expect(await markers.allTextContents()).toEqual(["[1]", "[1]", "[2]", "[1]"]);
    await expect(page.locator(".sidenote .cite-ref")).toHaveCount(1);
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

  test("set every quote alike, with an attribution in a footer", async ({ page }) => {
    await expect(page.locator("#attributed-quote + blockquote footer")).toContainText("Borges");
    expect(await page.locator("#default-quote + blockquote").evaluate((el) => getComputedStyle(el).fontStyle)).toBe("italic");
  });

  test("set figures in the column, and wide figures across the margin on wide screens", async ({ page }, info) => {
    const figures = page.locator("article figure");
    await expect(figures).toHaveCount(2);
    await expect(figures.nth(0).locator("figcaption")).toContainText("An orbit, drawn to no scale.");
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

  test("point dead links at the Wayback Machine, in the dead-link color with a dotted underline", async ({ page }) => {
    const dead = page.getByRole("link", { name: "a page that no longer exists" });
    await expect(dead).toHaveAttribute("href", "https://web.archive.org/web/20261027/https://dead-link-test.invalid/page");
    await expect(dead).toHaveClass(/\bdead\b/);
    const live = page.getByRole("link", { name: "asemorales/bierstadt" });
    const style = (l: Locator) => l.evaluate((el) => [getComputedStyle(el).color, getComputedStyle(el).textDecorationStyle]);
    const [[deadColor, deadLine], [liveColor]] = await Promise.all([style(dead), style(live)]);
    expect(deadColor).not.toBe(liveColor);
    expect(deadLine).toBe("dotted");
    await expect(page.locator("section.sources a.dead")).toHaveAttribute("href", /^https:\/\/web\.archive\.org\//);
  });
});

test.describe("bottom matter", () => {
  test("list notes that link here under See also, in the contents too", async ({ page }) => {
    await expect(page.locator("#see-also + ul a")).toHaveAttribute("href", "/dolor-sit-amet/");
    await expect(page.locator("nav.toc a[href='#see-also']")).toHaveCount(1);
    await page.goto("/acknowledgements/");
    await expect(page.locator("#see-also")).toHaveCount(0);
  });

  test("list References and External links last in the contents, collapsed", async ({ page }) => {
    const back = page.locator("nav.toc > details > ol > li");
    await expect(back.nth(-2).locator("a")).toHaveAttribute("href", "#references");
    await expect(back.last().locator("a")).toHaveAttribute("href", "#external-links");
    for (const id of ["references", "external-links"]) {
      const details = page.locator(`section.sources:has(h2#${id}) details`);
      await expect(details).not.toHaveAttribute("open");
      await expect(details.locator("li").first()).toBeHidden();
      await details.locator("summary").click();
      await expect(details.locator("li").first()).toBeVisible();
    }
  });

  test("number references, with locators, and backlinks to each citation", async ({ page }) => {
    const refs = page.locator("section.sources:has(h2#references) li");
    await expect(refs).toHaveCount(2);
    await expect(refs.first()).toHaveAttribute("id", "ref-1");
    await expect(refs.first()).toContainText("Turing 1936, §8");
    const backs = refs.first().locator(".backrefs a");
    await expect(backs).toHaveText(["a", "b", "c"]);
    await expect(page.locator((await backs.first().getAttribute("href"))!)).toHaveClass("cite-ref");
  });

  test("list other external links once each, and leave citations out", async ({ page }) => {
    const links = page.locator("section.sources:has(h2#external-links) li");
    await expect(links).toHaveCount(10);
    await expect(links.locator("a[href^='http']").first()).toHaveAttribute("href", "https://github.com/adobe-fonts/source-serif");
    await expect(links.locator("a[href*='doi.org/10.1112']")).toHaveCount(0);
    const back = links.first().locator(".backrefs a");
    await expect(page.locator((await back.getAttribute("href"))!)).toHaveAttribute("href", "https://github.com/adobe-fonts/source-serif");
  });

  test("citation markers open References and jump to their entry", async ({ page }) => {
    await page.locator(".cite-ref a").first().click();
    await expect(page).toHaveURL(/#ref-1$/);
    await expect(page.locator("#ref-1")).toBeInViewport();
  });

  test("dates the note under its title, with no period", async ({ page }) => {
    const dates = page.locator("h1 + p");
    await expect(dates).not.toContainText("First written");
    await expect(dates).not.toHaveText(/\.\s*$/);
    await expect(dates.locator("time").first()).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
  });

  test("shows tags under a label", async ({ page }) => {
    await expect(page.locator(".tags-label")).toHaveText("Tags");
    await expect(page.locator("a.tag")).toHaveAttribute("href", "/tags/test/");
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
