import { expect, test, type Page } from "@playwright/test";

const phone = (name: string) => name.includes("phone");
const plants = (page: Page) => page.locator("#lsystems path").count();
const segments = (page: Page) =>
  page.locator("#lsystems path").evaluateAll((paths) => paths.reduce((sum, path) => sum + path.getAttribute("d")!.split("M").length - 1, 0));
const scrollToFraction = (page: Page, fraction: number) =>
  page.evaluate((f) => scrollTo({ top: f * document.documentElement.scrollHeight - innerHeight, behavior: "instant" }), fraction);
const fixRandom = (page: Page, roll: number) => page.addInitScript((r) => (Math.random = () => r), roll);
const loadWithPausedClock = async (page: Page) => {
  await page.clock.install();
  await page.goto("/lorem-ipsum/");
  await page.clock.pauseAt(Date.now() + 60_000);
};

test.describe("L-systems", () => {
  test("stay hidden without JS", async ({ page }, info) => {
    test.skip(!info.project.name.includes("nojs"), "needs JS off");
    await page.goto("/lorem-ipsum/");
    await expect(page.locator("#lsystems")).toBeHidden();
  });

  test.describe("with JS", () => {
    test.skip(({ javaScriptEnabled }) => !javaScriptEnabled, "needs JS");

    for (const [roll, wide, narrow] of [
      [0, 3, 1],
      [0.99, 4, 2],
    ]) {
      test(`start with ${wide} grown plants on desktop and ${narrow} on mobile`, async ({ page }, info) => {
        await fixRandom(page, roll);
        await page.goto("/lorem-ipsum/");
        const count = phone(info.project.name) ? narrow : wide;
        await expect.poll(() => plants(page)).toBe(count);
        expect(await segments(page)).toBeGreaterThanOrEqual(16 * count);
      });
    }

    test("grow on a long page only while the viewport's bottom is past 90%", async ({ page }) => {
      await page.goto("/lorem-ipsum/");
      const initial = await segments(page);
      await scrollToFraction(page, 0.85);
      await page.waitForTimeout(1500);
      expect(await segments(page)).toBe(initial);

      await scrollToFraction(page, 0.91);
      await expect.poll(() => segments(page)).toBeGreaterThan(initial);

      await scrollToFraction(page, 0.85);
      await page.waitForTimeout(100);
      const paused = await segments(page);
      await page.waitForTimeout(1500);
      expect(await segments(page)).toBe(paused);

      await scrollToFraction(page, 1);
      await expect.poll(() => segments(page)).toBeGreaterThan(paused);
    });

    test("grow without scrolling on a page that fits on screen", async ({ page }) => {
      await page.setViewportSize({ width: page.viewportSize()!.width, height: 2000 });
      await page.goto("/404.html");
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(2000);
      const initial = await segments(page);
      await expect.poll(() => segments(page)).toBeGreaterThan(initial);
      const box = await page.locator("#lsystems").boundingBox();
      expect(box!.y + box!.height).toBe(2000);
    });

    test("stagger up to three plants, then replace each one that finishes", async ({ page }) => {
      await fixRandom(page, 0.99);
      await loadWithPausedClock(page);
      const initial = await plants(page);
      await scrollToFraction(page, 1);
      await page.waitForTimeout(200);

      await page.clock.runFor(100);
      expect(await plants(page)).toBe(initial + 1);
      await page.clock.runFor(2700);
      expect(await plants(page)).toBe(initial + 1);
      await page.clock.runFor(300);
      expect(await plants(page)).toBe(initial + 2);
      await page.clock.runFor(3000);
      expect(await plants(page)).toBe(initial + 3);
      await page.clock.runFor(2500);
      expect(await plants(page)).toBe(initial + 3);
      await page.clock.runFor(800);
      expect(await plants(page)).toBe(initial + 4);
    });

    test("grow one plant at a time when the random count is one", async ({ page }) => {
      await fixRandom(page, 0);
      await loadWithPausedClock(page);
      const initial = await plants(page);
      await scrollToFraction(page, 1);
      await page.waitForTimeout(200);

      await page.clock.runFor(100);
      expect(await plants(page)).toBe(initial + 1);
      await page.clock.runFor(8500);
      expect(await plants(page)).toBe(initial + 1);
      await page.clock.runFor(800);
      expect(await plants(page)).toBe(initial + 2);
    });

    test("pick a new number to grow at a time when a plant finishes", async ({ page }) => {
      await fixRandom(page, 0);
      await loadWithPausedClock(page);
      const initial = await plants(page);
      await scrollToFraction(page, 1);
      await page.waitForTimeout(200);

      await page.clock.runFor(8600);
      expect(await plants(page)).toBe(initial + 1);
      await page.evaluate(() => (Math.random = () => 0.99));
      await page.clock.runFor(800);
      expect(await plants(page)).toBe(initial + 2);
      await page.clock.runFor(3200);
      expect(await plants(page)).toBe(initial + 3);
    });

    test("stop at 20 plants on desktop and 10 on mobile", async ({ page }, info) => {
      const max = phone(info.project.name) ? 10 : 20;
      await fixRandom(page, 0.99);
      await loadWithPausedClock(page);
      await scrollToFraction(page, 1);
      await page.waitForTimeout(200);
      await page.clock.runFor(120_000);
      expect(await plants(page)).toBe(max);
      expect(await segments(page)).toBe(16 * max);
    });

    test("draw every plant in full at once under reduced motion", async ({ page }, info) => {
      const max = phone(info.project.name) ? 10 : 20;
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/lorem-ipsum/");
      expect(await plants(page)).toBeLessThanOrEqual(4);
      await scrollToFraction(page, 1);
      await expect.poll(() => plants(page)).toBe(max);
      expect(await segments(page)).toBeGreaterThanOrEqual(16 * max);
    });
  });
});
