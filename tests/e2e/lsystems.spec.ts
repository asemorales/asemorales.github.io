import { expect, test, type Page } from "@playwright/test";

const phone = (name: string) => name.includes("phone");
const plants = (page: Page) => page.locator("#lsystems path").count();
const segments = (page: Page) =>
  page.locator("#lsystems path").evaluateAll((paths) => paths.reduce((sum, path) => sum + path.getAttribute("d")!.split("M").length - 1, 0));
const scrollToFraction = (page: Page, fraction: number) =>
  page.evaluate((f) => scrollTo({ top: f * document.documentElement.scrollHeight - innerHeight, behavior: "instant" }), fraction);
const fixRandom = (page: Page, roll: number) => page.addInitScript((r) => (Math.random = () => r), roll);
const trees = (page: Page) =>
  page.locator("#lsystems path").evaluateAll((paths) => paths.filter((path) => (path as SVGPathElement).getBBox().height > 140).length);
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
        expect(await segments(page)).toBeGreaterThanOrEqual(count);
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

    test("start plants three seconds apart at the longest", async ({ page }) => {
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

    test("grow at most three plants at a time and wait for one to finish", async ({ page }) => {
      await fixRandom(page, 0.99);
      await loadWithPausedClock(page);
      const initial = await plants(page);
      await page.evaluate(() => (Math.random = () => 0.41));
      await scrollToFraction(page, 1);
      await page.waitForTimeout(200);

      await page.clock.runFor(100);
      expect(await plants(page)).toBe(initial + 1);
      await page.clock.runFor(1800);
      expect(await plants(page)).toBe(initial + 2);
      await page.clock.runFor(1800);
      expect(await plants(page)).toBe(initial + 3);
      await page.clock.runFor(1800);
      expect(await plants(page)).toBe(initial + 3);
      await page.clock.runFor(1000);
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
      await page.clock.runFor(4300);
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

      await page.clock.runFor(4400);
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
      const grown = await segments(page);
      await page.clock.runFor(10_000);
      expect(await segments(page)).toBe(grown);
    });

    test("cap trees at 8 on desktop and 3 on mobile, and fill the rest with other plants", async ({ page }, info) => {
      const [max, cap] = phone(info.project.name) ? [10, 3] : [20, 8];
      await fixRandom(page, 0);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/lorem-ipsum/");
      await scrollToFraction(page, 1);
      await expect.poll(() => plants(page)).toBe(max);
      expect(await trees(page)).toBe(cap);
    });

    test("keep every plant inside the band's sides", async ({ page }, info) => {
      const max = phone(info.project.name) ? 10 : 20;
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/lorem-ipsum/");
      await scrollToFraction(page, 1);
      await expect.poll(() => plants(page)).toBe(max);
      const width = await page.evaluate(() => document.querySelector("#lsystems svg")!.getBoundingClientRect().width);
      const sides = await page.locator("#lsystems path").evaluateAll((paths) =>
        paths.map((path) => {
          const { x, width } = (path as SVGPathElement).getBBox();
          return [x, x + width];
        }),
      );
      expect(Math.min(...sides.map(([left]) => left))).toBeGreaterThanOrEqual(0);
      expect(Math.max(...sides.map(([, right]) => right))).toBeLessThanOrEqual(width);
    });

    test("draw every plant in full at once under reduced motion", async ({ page }, info) => {
      const max = phone(info.project.name) ? 10 : 20;
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/lorem-ipsum/");
      expect(await plants(page)).toBeLessThanOrEqual(4);
      await scrollToFraction(page, 1);
      await expect.poll(() => plants(page)).toBe(max);
      expect(await segments(page)).toBeGreaterThanOrEqual(max);
    });
  });
});
