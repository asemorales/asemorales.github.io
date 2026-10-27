import { expect, test, type Page } from "@playwright/test";

// Popovers need a mouse or a keyboard, and JS. Phones get the drawer.
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

  test("prefer a hand-written annotation", async ({ page }) => {
    await expect((await hover(page, "gwern.net design")).locator(".popover-body")).toContainText("Gwern Branwen's essay");
  });

  test("say a dead link's copy is archived", async ({ page }) => {
    await expect((await hover(page, "a page that no longer exists")).locator(".popover-dead")).toContainText("Archived copy");
  });

  test("preview a heading's first paragraph", async ({ page }) => {
    const p = await hover(page, "Lorem Ipsum > Typography");
    await expect(p.locator(".popover-title")).toHaveText("Typography");
    await expect(p.locator(".popover-body")).toContainText("Excepteur sint occaecat");
  });

  test("open on keyboard focus and close on Escape", async ({ page }) => {
    const link = page.getByRole("link", { name: "asemorales/bierstadt" });
    // Tab back onto the link, so its focus comes from the keyboard.
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
    await page.getByRole("link", { name: "asemorales/bierstadt" }).tap();
    const drawer = page.locator("dialog.link-drawer");
    await expect(drawer).toBeVisible();
    await expect(page).toHaveURL(/\/lorem-ipsum\/$/);
    await expect(drawer.locator(".popover-title")).toHaveText("asemorales/bierstadt");
    await expect(drawer.locator(".drawer-go")).toHaveText("Open github.com");
    await expect(drawer.locator(".drawer-go")).toHaveAttribute("href", "https://github.com/asemorales/bierstadt");
    const box = (await drawer.boundingBox())!;
    expect(Math.round(box.y + box.height)).toBe(page.viewportSize()!.height);
    await drawer.getByRole("button", { name: "Close preview" }).tap();
    await expect(drawer).toBeHidden();
  });

  test("a tap outside closes it, and its button reads a linked note", async ({ page }) => {
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
