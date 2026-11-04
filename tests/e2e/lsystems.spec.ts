import { expect, test } from "@playwright/test";

test.describe("L-systems", () => {
  const generations = (page: import("@playwright/test").Page) => page.locator("#lsystems path").count();
  const scrollToFraction = (page: import("@playwright/test").Page, fraction: number) =>
    page.evaluate((f) => scrollTo({ top: f * document.documentElement.scrollHeight - innerHeight, behavior: "instant" }), fraction);

  test("stay hidden without JS", async ({ page }, info) => {
    test.skip(!info.project.name.includes("nojs"), "needs JS off");
    await page.goto("/lorem-ipsum/");
    await expect(page.locator("#lsystems")).toBeHidden();
  });

  test("grow on a long page only while the viewport's bottom is past 90%", async ({ page }, info) => {
    test.skip(info.project.name.includes("nojs"), "needs JS");
    await page.goto("/lorem-ipsum/");
    await scrollToFraction(page, 0.85);
    await page.waitForTimeout(1500);
    expect(await generations(page)).toBe(0);

    await scrollToFraction(page, 0.91);
    await expect.poll(() => generations(page)).toBeGreaterThanOrEqual(2);

    await scrollToFraction(page, 0.85);
    await page.waitForTimeout(100);
    const paused = await generations(page);
    await page.waitForTimeout(1500);
    expect(await generations(page)).toBe(paused);

    await scrollToFraction(page, 1);
    await expect.poll(() => generations(page)).toBeGreaterThan(paused);
  });

  test("grow without scrolling on a page that fits on screen", async ({ page }, info) => {
    test.skip(info.project.name.includes("nojs"), "needs JS");
    await page.setViewportSize({ width: page.viewportSize()!.width, height: 2000 });
    await page.goto("/404.html");
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(2000);
    await expect.poll(() => generations(page)).toBeGreaterThanOrEqual(2);
    const box = await page.locator("#lsystems").boundingBox();
    expect(box!.y + box!.height).toBe(2000);
  });

  test("draw in full at once under reduced motion", async ({ page }, info) => {
    test.skip(info.project.name.includes("nojs"), "needs JS");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/lorem-ipsum/");
    expect(await generations(page)).toBe(0);
    await scrollToFraction(page, 1);
    await expect.poll(() => generations(page)).toBe(16);
  });
});
