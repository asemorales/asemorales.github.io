import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/lorem-ipsum/", "/tags/test/", "/404.html"];
const LIGHT = "rgb(242, 236, 223)";
const DARK = "rgb(25, 22, 18)";

const background = (page: import("@playwright/test").Page) => page.locator("html").evaluate((el) => getComputedStyle(el).backgroundColor);

test.describe("pages", () => {
  for (const path of PAGES) {
    test(`${path} has no horizontal scroll`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test(`${path} passes axe`, async ({ page }, info) => {
      test.skip(info.project.name.includes("nojs"), "axe runs as page script");
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe("lorem ipsum page", () => {
  test("builds from the vault and stays unlisted", async ({ page, request }) => {
    await page.goto("/lorem-ipsum/");
    await expect(page.locator("h1")).toHaveText("Lorem Ipsum");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    await expect(page.locator("article")).not.toContainText("Obsidian comments like this one");

    await page.goto("/");
    await expect(page.locator('a[href="/lorem-ipsum/"]')).toHaveCount(0);
    const sitemap = await (await request.get("/sitemap-0.xml")).text();
    expect(sitemap).not.toContain("lorem-ipsum");
    expect(sitemap).not.toContain("/tags/test/");
  });

  test("sets body text and headings in Source Serif 4", async ({ page }) => {
    await page.goto("/lorem-ipsum/");
    const family = (sel: string) =>
      page
        .locator(sel)
        .first()
        .evaluate((el) => getComputedStyle(el).fontFamily);
    expect(await family("article p")).toMatch(/^"?Source Serif 4"?,/);
    expect(await family("article h2")).toMatch(/^"?Source Serif 4"?,/);
  });
});

test.describe("theme without JS", () => {
  test.skip(({ javaScriptEnabled }) => javaScriptEnabled !== false, "no-JS projects only");

  test("follows the system setting and hides the toggle", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/lorem-ipsum/");
    expect(await background(page)).toBe(DARK);
    await expect(page.locator("#room-toggle")).toBeHidden();
    await page.emulateMedia({ colorScheme: "light" });
    expect(await background(page)).toBe(LIGHT);
  });
});

test.describe("theme with JS", () => {
  test.skip(({ javaScriptEnabled }) => javaScriptEnabled === false, "JS projects only");

  test("cycles auto, light, and dark", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/lorem-ipsum/");
    const toggle = page.locator("#room-toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText("auto");
    expect(await background(page)).toBe(DARK);

    await toggle.click();
    await expect(toggle).toContainText("light");
    expect(await background(page)).toBe(LIGHT);

    await toggle.click();
    await expect(toggle).toContainText("dark");
    expect(await background(page)).toBe(DARK);

    await toggle.click();
    await expect(toggle).toContainText("auto");
    expect(await page.evaluate(() => localStorage.getItem("room"))).toBeNull();
  });

  test("applies a saved room before first paint", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/lorem-ipsum/");
    await page.evaluate(() => localStorage.setItem("room", "light"));
    // Record the room as soon as <body> starts parsing. The stylesheet blocks the
    // first paint, so a room set by then is applied before anything shows.
    await page.addInitScript(() => {
      new MutationObserver((_, observer) => {
        if (!document.body) return;
        (window as unknown as { firstRoom?: string }).firstRoom = document.documentElement.dataset.room;
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await page.reload();
    expect(await page.evaluate(() => (window as unknown as { firstRoom?: string }).firstRoom)).toBe("light");
    expect(await background(page)).toBe(LIGHT);
    await expect(page.locator("#room-toggle")).toContainText("light");
  });
});
