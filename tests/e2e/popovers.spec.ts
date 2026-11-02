import { expect, test, type Page } from "@playwright/test";

const wideWithJs = () =>
  test.beforeEach(async ({ javaScriptEnabled }, info) => {
    test.skip(javaScriptEnabled === false || !info.project.name.startsWith("wide"), "wide screens with JS");
  });

const popover = (page: Page) => page.locator("#link-popover");

async function hover(page: Page, name: string | RegExp) {
  await page
    .getByRole("link", { name, exact: typeof name === "string" })
    .first()
    .hover();
  await expect(popover(page)).toBeVisible();
  return popover(page);
}

test.describe("popovers on the lorem page", () => {
  wideWithJs();
  test.beforeEach(async ({ page }) => {
    await page.goto("/lorem-ipsum/");
  });

  test("show a GitHub card, with no images", async ({ page }) => {
    const p = await hover(page, "asemorales/bierstadt");
    await expect(p.locator(".popover-title")).toHaveText("asemorales/bierstadt");
    await expect(p.locator(".popover-meta")).toContainText("★");
    await expect(p.locator("img")).toHaveCount(0);
    await expect(p.locator(".popover-more")).toHaveText("Go to site");
    await expect(p.locator(".popover-more")).toHaveAttribute("href", "https://github.com/asemorales/bierstadt");
    await expect(p.locator(".popover-more")).toHaveAttribute("target", "_blank");
    await expect(p.locator(".popover-more .icon-external")).toBeVisible();
  });

  test("keep Go to site in view when the preview is long", async ({ page }) => {
    const p = await hover(page, "MobileLookNet");
    const box = (await p.boundingBox())!;
    const more = (await p.locator(".popover-more").boundingBox())!;
    expect(more.y + more.height).toBeLessThanOrEqual(box.y + box.height);
  });

  test("link a citation's popover to its source", async ({ page }) => {
    await page.locator(".cite-ref a").first().hover();
    await expect(popover(page).locator(".popover-more")).toHaveText("Go to site");
    await expect(popover(page).locator(".popover-more")).toHaveAttribute("href", "https://doi.org/10.1112/plms/s2-42.1.230");
  });

  test("show a citation's formatted locator as text", async ({ page }) => {
    await page.locator(".cite-ref a").nth(2).hover();
    await expect(popover(page).locator(".popover-meta")).toContainText("Lorem ipsum, p. 358");
  });

  test("show arXiv, DOI, and Wikipedia cards", async ({ page }) => {
    await expect(await hover(page, "Attention Is All You Need")).toContainText("Vaswani");
    await page.mouse.move(0, 0);
    await expect(popover(page)).toBeHidden();
    await expect(await hover(page, "MobileLookNet")).toContainText("Osseous Metastasis");
    await page.mouse.move(0, 0);
    await expect(popover(page)).toBeHidden();
    await expect(await hover(page, "Halting problem")).toContainText("In computability theory");
  });

  test("show a citation's source text", async ({ page }) => {
    const card = { title: "Mock source", meta: [], paragraphs: ["Mock source text."] };
    await page.route("**/popovers.json", (route) => route.fulfill({ json: { "https://doi.org/10.1112/plms/s2-42.1.230": card } }));
    await page.locator(".cite-ref a").first().hover();
    await expect(popover(page).locator(".popover-body")).toHaveText(card.paragraphs[0]);
  });

  test("say a dead link's copy is archived", async ({ page }) => {
    await expect((await hover(page, "a page that no longer exists")).locator(".popover-dead")).toContainText("Archived copy");
  });

  test("preview a heading's first paragraph", async ({ page }) => {
    const p = await hover(page, "Lorem Ipsum > Typography");
    await expect(p.locator(".popover-title")).toHaveText("Typography");
    await expect(p.locator(".popover-body")).toContainText("Incomprehensibilities");
  });

  test("show a glossary term's type and every sense, for a word with an accent", async ({ page }) => {
    const href = "/glossary/#móck-noun";
    const card = { title: "mock term", type: "mock type", paragraphs: ["1. First sense.", "2. Second sense."] };
    await page.route("**/popovers.json", (route) => route.fulfill({ json: { [href]: card } }));
    await page
      .locator("article > p")
      .first()
      .evaluate((p, url) => {
        const a = document.createElement("a");
        a.href = url;
        a.textContent = "mock link";
        p.append(a);
      }, href);
    const p = await hover(page, "mock link");
    await expect(p.locator(".popover-title")).toHaveText(`${card.title} ${card.type}`);
    const [row, type] = await Promise.all([p.locator(".popover-title").boundingBox(), p.locator(".term-type").boundingBox()]);
    expect(row!.height).toBeLessThan(type!.height * 2);
    await expect(p.locator(".popover-body p")).toHaveText(card.paragraphs);
  });

  test("open on keyboard focus and close on Escape", async ({ page }) => {
    const link = page.getByRole("link", { name: "asemorales/bierstadt" }).first();
    await link.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(link).toBeFocused();
    await expect(popover(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popover(page)).toBeHidden();
  });

  test("skip the contents and section anchors", async ({ page }) => {
    await page.locator("nav.toc a[href='#typography']").hover();
    await page.waitForTimeout(600);
    await expect(popover(page)).toBeHidden();
  });
});

test.describe("popovers on other notes", () => {
  wideWithJs();

  test("show a note's opening epigraph above its first paragraph", async ({ page }) => {
    await page.goto("/lorem-ipsum/");
    const p = await hover(page, /^Dolor Sit Amet/);
    await expect(p.locator(".popover-epigraph p")).toHaveText("Neque porro quisquam est qui dolorem ipsum.");
    await expect(p.locator(".popover-epigraph footer")).toHaveText("Cicero, De Finibus");
    await expect(p.locator(".popover-epigraph + p")).toContainText("This page checks");
    await expect(p.locator(".popover-more")).toBeVisible();
  });

  test("preview a linked note's opening, with a link to read more", async ({ page }) => {
    await page.goto("/dolor-sit-amet/");
    const p = await hover(page, "Lorem Ipsum");
    await expect(p.locator(".popover-title")).toHaveText("Lorem Ipsum");
    await expect(p.locator(".popover-body")).toContainText("Lorem ipsum dolor sit amet");
    await expect(p.locator(".popover-more")).toHaveAttribute("href", /\/lorem-ipsum\/$/);
  });
});

test.describe("drawer on touch screens", () => {
  test.beforeEach(async ({ javaScriptEnabled }, info) => {
    test.skip(javaScriptEnabled === false || !info.project.name.startsWith("phone"), "phones with JS");
  });

  test("a tap opens the preview from the bottom, with a button to follow the link", async ({ page }) => {
    await page.goto("/lorem-ipsum/");
    await page.getByRole("link", { name: "asemorales/bierstadt" }).first().tap();
    const drawer = page.locator("dialog.link-drawer");
    await expect(drawer).toBeVisible();
    await expect(page).toHaveURL(/\/lorem-ipsum\/$/);
    await expect(drawer.locator(".popover-title")).toHaveText("asemorales/bierstadt");
    await expect(drawer.locator(".drawer-go")).toHaveText("Open github.com");
    await expect(drawer.locator(".drawer-go")).toHaveAttribute("href", "https://github.com/asemorales/bierstadt");
    await expect
      .poll(async () => {
        const box = (await drawer.boundingBox())!;
        return Math.round(box.y + box.height);
      })
      .toBe(page.viewportSize()!.height);
    await drawer.getByRole("button", { name: "Close preview" }).tap();
    await expect(drawer).toBeHidden();
  });

  test("a tap outside closes it, and its button opens the linked note", async ({ page }) => {
    await page.goto("/dolor-sit-amet/");
    await page.getByRole("link", { name: "Lorem Ipsum", exact: true }).first().tap();
    const drawer = page.locator("dialog.link-drawer");
    await expect(drawer.locator(".popover-body")).toContainText("Lorem ipsum dolor sit amet");
    await expect(drawer.locator(".drawer-go")).toHaveText("Read note");
    await page.touchscreen.tap(10, 10);
    await expect(drawer).toBeHidden();
    await page.getByRole("link", { name: "Lorem Ipsum", exact: true }).first().tap();
    await drawer.locator(".drawer-go").tap();
    await expect(page).toHaveURL(/\/lorem-ipsum\/$/);
  });
});
