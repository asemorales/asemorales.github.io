import { expect, test, type Page } from "@playwright/test";

const phone = (name: string) => name.includes("phone");
const plants = (page: Page) => page.locator("#lsystems .plants path").count();
const segments = (page: Page) =>
  page.locator("#lsystems .plants path").evaluateAll((paths) => paths.reduce((sum, path) => sum + path.getAttribute("d")!.split("M").length - 1, 0));
const scrollToFraction = (page: Page, fraction: number) =>
  page.evaluate((f) => scrollTo({ top: f * document.documentElement.scrollHeight - innerHeight, behavior: "instant" }), fraction);
const fixRandom = (page: Page, roll: number) => page.addInitScript((r) => (Math.random = () => r), roll);
const trees = (page: Page) =>
  page.locator("#lsystems .plants path").evaluateAll((paths) => paths.filter((path) => (path as SVGPathElement).getBBox().height > 140).length);
const coarsenFrames = (page: Page) =>
  page.addInitScript(() => {
    window.requestAnimationFrame = (callback) => setTimeout(() => callback(performance.now()), 100) as unknown as number;
    window.cancelAnimationFrame = (frame) => clearTimeout(frame);
  });
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

  test("load only once the footer is near the viewport", async ({ page, javaScriptEnabled }) => {
    test.skip(!javaScriptEnabled, "needs JS");
    await page.goto("/lorem-ipsum/");
    expect(await plants(page)).toBe(0);
    await scrollToFraction(page, 1);
    await expect.poll(() => plants(page)).toBeGreaterThan(0);
  });

  test.describe("with JS", () => {
    test.skip(({ javaScriptEnabled }) => !javaScriptEnabled, "needs JS");
    test.beforeEach(({ page }) =>
      page.addInitScript(() => {
        window.IntersectionObserver = class {
          constructor(private callback: IntersectionObserverCallback) {}
          observe() {
            this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
          }
          disconnect() {}
        } as unknown as typeof IntersectionObserver;
      }),
    );

    for (const [roll, wide, narrow] of [
      [0.41, 3, 1],
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

    test("grow one plant at a time when the random count is one, and pick a new count when that plant finishes", async ({ page }) => {
      await fixRandom(page, 0);
      await loadWithPausedClock(page);
      const initial = await plants(page);
      await page.evaluate(() => (Math.random = () => 0.99));
      await scrollToFraction(page, 1);
      await page.waitForTimeout(200);

      await page.clock.runFor(100);
      expect(await plants(page)).toBe(initial + 1);
      await page.clock.runFor(4300);
      expect(await plants(page)).toBe(initial + 1);
      await page.clock.runFor(800);
      expect(await plants(page)).toBe(initial + 2);
      await page.clock.runFor(3200);
      expect(await plants(page)).toBe(initial + 3);
    });

    test("hold at most 20 plants on desktop and 10 on mobile", { tag: "@slow" }, async ({ page }, info) => {
      test.setTimeout(120_000);
      const max = phone(info.project.name) ? 10 : 20;
      await fixRandom(page, 0.99);
      await coarsenFrames(page);
      await loadWithPausedClock(page);
      await scrollToFraction(page, 1);
      await page.waitForTimeout(200);
      await page.clock.runFor(120_000);
      const count = await plants(page);
      expect(count).toBeGreaterThan(1);
      expect(count).toBeLessThanOrEqual(max);
    });

    test("wither old plants and seed new ones in their place", { tag: "@slow" }, async ({ page }) => {
      test.setTimeout(120_000);
      await fixRandom(page, 0.99);
      await coarsenFrames(page);
      await loadWithPausedClock(page);
      await page.locator("#lsystems .plants path").evaluateAll((paths) => paths.forEach((path) => path.setAttribute("data-original", "")));
      await scrollToFraction(page, 1);
      await page.waitForTimeout(200);
      await page.clock.runFor(200_000);
      expect(await page.locator("#lsystems .plants path[data-original]").count()).toBe(0);
      expect(await plants(page)).toBeGreaterThan(0);
    });

    test("do not age while scrolled away", async ({ page }) => {
      await fixRandom(page, 0.99);
      await loadWithPausedClock(page);
      const initial = await plants(page);
      const grown = await segments(page);
      await page.clock.runFor(400_000);
      expect(await plants(page)).toBe(initial);
      expect(await segments(page)).toBe(grown);
    });

    const rustling = (page: Page) => page.locator('#lsystems path[style*="skew"]');
    const pointOnPlant = async (page: Page) => {
      await scrollToFraction(page, 1);
      await page.mouse.move(1, 1);
      const find = () =>
        page.locator("#lsystems .plants path").evaluateAll((paths) => {
          const { left, top } = document.querySelector("#lsystems")!.getBoundingClientRect();
          return paths
            .flatMap((path) => {
              const shape = path as SVGPathElement;
              return [0.2, 0.4, 0.6, 0.8].map((fraction) => {
                const { x, y } = shape.getPointAtLength(shape.getTotalLength() * fraction);
                return { x: x + left, y: y + top };
              });
            })
            .find(({ x, y }) => x > 45 && x < innerWidth - 45 && document.elementFromPoint(x, y)?.closest("#lsystems"));
        });
      await expect.poll(find).toBeTruthy();
      return (await find())!;
    };
    const recordFirstLeans = (page: Page) =>
      page.evaluate(() => {
        const seen = new Map<Node, number>();
        (window as unknown as { firstLeans: () => number[] }).firstLeans = () => [...seen.values()];
        new MutationObserver((records) => {
          for (const { target } of records) {
            const lean = parseFloat((target as SVGPathElement).style.transform.replace("skewX(", ""));
            if (lean && !seen.has(target)) seen.set(target, lean);
          }
        }).observe(document.querySelector("#lsystems")!, { subtree: true, attributes: true, attributeFilter: ["style"] });
      });
    const firstLeans = (page: Page) => page.evaluate(() => (window as unknown as { firstLeans: () => number[] }).firstLeans());

    for (const [direction, from, skew] of [
      ["right", -40, -1],
      ["left", 40, 1],
    ] as const) {
      test(`lean ${direction} when the pointer moves ${direction} onto a plant`, async ({ page }) => {
        await page.goto("/lorem-ipsum/");
        const { x, y } = await pointOnPlant(page);
        await page.mouse.move(x + from, y);
        await page.waitForTimeout(3000);
        await recordFirstLeans(page);
        await page.mouse.move(x, y, { steps: 8 });
        await expect.poll(() => firstLeans(page).then((leans) => leans.length)).toBeGreaterThan(0);
        for (const lean of await firstLeans(page)) expect(Math.sign(lean)).toBe(skew);
      });
    }

    test("ease to rest under a still pointer and rustle again when the pointer moves or leaves", async ({ page }) => {
      await page.goto("/lorem-ipsum/");
      const { x, y } = await pointOnPlant(page);
      await page.mouse.move(x - 20, y);
      await page.mouse.move(x, y, { steps: 5 });
      await expect.poll(() => rustling(page).count()).toBeGreaterThan(0);
      await expect.poll(() => rustling(page).count(), { timeout: 5000 }).toBe(0);
      await page.waitForTimeout(500);
      expect(await rustling(page).count()).toBe(0);

      await page.mouse.move(x + 3, y, { steps: 3 });
      await expect.poll(() => rustling(page).count()).toBeGreaterThan(0);
      await expect.poll(() => rustling(page).count(), { timeout: 5000 }).toBe(0);

      await page.mouse.move(x + 3, 1, { steps: 4 });
      await expect.poll(() => rustling(page).count()).toBeGreaterThan(0);
      await expect.poll(() => rustling(page).count(), { timeout: 5000 }).toBe(0);
    });

    test("do not rustle under reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/lorem-ipsum/");
      const { x, y } = await pointOnPlant(page);
      await page.mouse.move(x - 20, y);
      await recordFirstLeans(page);
      await page.mouse.move(x, y, { steps: 5 });
      await page.waitForTimeout(300);
      expect(await firstLeans(page)).toEqual([]);
    });

    test("plant where the band is tapped", async ({ page }) => {
      await fixRandom(page, 0.99);
      await loadWithPausedClock(page);
      await scrollToFraction(page, 1);
      await page.waitForTimeout(200);
      const before = await plants(page);
      const band = page.locator("#lsystems");
      await page.evaluate(() => (Math.random = () => 0.5));
      const empty = await page.locator("#lsystems .plants path").evaluateAll(
        (paths, width) => {
          const centers = paths.map((path) => (path as SVGPathElement).getBBox()).map(({ x, width }) => x + width / 2);
          const gap = (spot: number) => Math.min(...centers.map((center) => Math.abs(center - spot)));
          const spots = Array.from({ length: Math.floor(width / 2) }, (_, index) => Math.floor(width / 4) + index);
          return spots.sort((a, b) => gap(b) - gap(a))[0];
        },
        (await band.boundingBox())!.width,
      );
      await band.click({ position: { x: empty, y: 100 } });
      expect(await plants(page)).toBe(before + 1);
      await page.clock.runFor(6000);
      const { x, width } = await page
        .locator("#lsystems .plants path")
        .nth(before)
        .evaluate((path) => {
          const box = (path as SVGPathElement).getBBox();
          return { x: box.x, width: box.width };
        });
      expect(empty).toBeGreaterThanOrEqual(x - 1);
      expect(empty).toBeLessThanOrEqual(x + width + 1);
    });

    test("wither the nearest plant when a full band is tapped, and stay within the cap", { tag: "@slow" }, async ({ page }, info) => {
      test.setTimeout(120_000);
      const max = phone(info.project.name) ? 10 : 20;
      await fixRandom(page, 0.99);
      await coarsenFrames(page);
      await loadWithPausedClock(page);
      await scrollToFraction(page, 1);
      await page.waitForTimeout(200);
      await page.clock.runFor(50_000);
      const before = await plants(page);
      const band = (await page.locator("#lsystems").boundingBox())!;
      await page.locator("#lsystems").evaluate((root) =>
        root.querySelectorAll(".plants path").forEach((path, index) => {
          path.setAttribute("data-index", String(index));
          path.setAttribute("data-length", String(path.getAttribute("d")!.length));
        }),
      );
      const middle = band.width / 2;
      const nearest = await page.locator("#lsystems .plants path").evaluateAll(
        (paths, x) =>
          paths
            .map((path) => {
              const box = (path as SVGPathElement).getBBox();
              return { index: path.getAttribute("data-index"), gap: Math.abs(box.x + box.width / 2 - x) };
            })
            .sort((a, b) => a.gap - b.gap)[0].index,
        middle,
      );
      for (let tries = 0; tries < 4; tries++) {
        await page.locator("#lsystems").click({ position: { x: middle, y: 100 } });
      }
      await page.clock.runFor(1000);
      const withering = await page
        .locator("#lsystems .plants path[data-index]")
        .evaluateAll((paths) => paths.filter((path) => path.getAttribute("d")!.length < Number(path.getAttribute("data-length"))).length);
      const sprouting = await page
        .locator("#lsystems .plants path:not([data-index])")
        .evaluateAll((paths) => paths.filter((path) => path.getAttribute("d")).length);
      expect(withering).toBeGreaterThan(0);
      expect(sprouting).toBeGreaterThan(0);
      await page.clock.runFor(20_000);
      expect(await page.locator(`#lsystems .plants path[data-index="${nearest}"]`).count()).toBe(0);
      expect(await plants(page)).toBeGreaterThanOrEqual(Math.min(before, 2));
      expect(await plants(page)).toBeLessThanOrEqual(max);
    });

    test("replace the nearest plant when a full band is tapped under reduced motion", async ({ page }, info) => {
      const max = phone(info.project.name) ? 10 : 20;
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/lorem-ipsum/");
      await scrollToFraction(page, 1);
      await expect.poll(() => plants(page)).toBeGreaterThan(4);
      await page.locator("#lsystems .plants path").evaluateAll((paths) => paths.forEach((path) => path.setAttribute("data-original", "")));
      for (let tries = 0; tries < 30; tries++) {
        await page.locator("#lsystems").click({ position: { x: 5 + tries * 11, y: 100 } });
      }
      expect(await page.locator("#lsystems .plants path:not([data-original])").count()).toBeGreaterThan(0);
      expect(await plants(page)).toBeLessThanOrEqual(max);
    });

    for (const [width, max, cap] of [
      [500, 10, 3],
      [640, 13, 4],
      [768, 14, 5],
      [1024, 17, 7],
      [1280, 20, 8],
      [1536, 20, 8],
    ]) {
      test(`hold at most ${max} plants and ${cap} trees at ${width}px`, { tag: "@once" }, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto("/lorem-ipsum/");
        const caps = await page.locator("#lsystems").evaluate((element) => {
          const styles = getComputedStyle(element);
          return [styles.getPropertyValue("--plants"), styles.getPropertyValue("--trees")].map(Number);
        });
        expect(caps).toEqual([max, cap]);
      });
    }

    test("cap trees at 8 on desktop and 3 on mobile", async ({ page }, info) => {
      const cap = phone(info.project.name) ? 3 : 8;
      await fixRandom(page, 0);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/lorem-ipsum/");
      const initial = await plants(page);
      await scrollToFraction(page, 1);
      // A roll of 0 grows the largest trees, which take seconds to fill the band.
      await expect.poll(() => plants(page), { timeout: 20_000 }).toBeGreaterThan(initial);
      expect(await trees(page)).toBeLessThanOrEqual(cap);
    });

    test("keep every plant inside the band's sides", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/lorem-ipsum/");
      const initial = await plants(page);
      await scrollToFraction(page, 1);
      await expect.poll(() => plants(page)).toBeGreaterThan(initial);
      const width = await page.evaluate(() => document.querySelector("#lsystems svg")!.getBoundingClientRect().width);
      const sides = await page.locator("#lsystems .plants path").evaluateAll((paths) =>
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
      await expect.poll(() => plants(page)).toBeGreaterThan(4);
      const count = await plants(page);
      expect(count).toBeLessThanOrEqual(max);
      expect(await segments(page)).toBeGreaterThanOrEqual(count);
    });

    const latestTended = (page: Page) =>
      page.locator("#lsystems").evaluate((root) => Math.max(...(root as HTMLElement).dataset.tended!.split(" ").map(Date.parse)));
    const fireflies = (page: Page) => page.locator("#lsystems .wildlife .stroke-glow");
    const visitWhileTended = async (page: Page) => {
      await page.goto("/lorem-ipsum/");
      await page.clock.install({ time: (await latestTended(page)) + 86_400_000 });
    };
    const spot = (el: Element) =>
      el
        .getAttribute("transform")!
        .match(/translate\(([-\d.]+) ([-\d.]+)\)/)!
        .slice(1)
        .map(Number);

    test("bring wildlife only for notes tended in the last 30 days", async ({ page }) => {
      await page.goto("/lorem-ipsum/");
      const latest = await latestTended(page);
      await page.clock.install({ time: latest + 31 * 86_400_000 });
      await page.reload();
      await scrollToFraction(page, 1);
      await page.waitForTimeout(500);
      expect(await page.locator("#lsystems .wildlife > *").count()).toBe(0);

      await page.clock.setSystemTime(latest + 86_400_000);
      await page.reload();
      await scrollToFraction(page, 1);
      await expect.poll(() => fireflies(page).count()).toBeGreaterThan(0);
    });

    test("scatter fireflies from the pointer", async ({ page }) => {
      await visitWhileTended(page);
      await page.reload();
      await scrollToFraction(page, 1);
      await expect.poll(() => fireflies(page).count()).toBeGreaterThan(0);
      await page.waitForTimeout(500);
      const band = (await page.locator("#lsystems").boundingBox())!;
      const [x, y] = await fireflies(page).first().evaluate(spot);
      await page.mouse.move(band.x + x + 10, band.y + y, { steps: 2 });
      await page.mouse.move(band.x + x, band.y + y, { steps: 2 });
      await expect
        .poll(async () => {
          const [after, below] = await fireflies(page).first().evaluate(spot);
          return Math.hypot(after - x, below - y);
        })
        .toBeGreaterThan(10);
    });

    test("hold wildlife still under reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await visitWhileTended(page);
      await page.reload();
      await scrollToFraction(page, 1);
      await expect.poll(() => fireflies(page).count()).toBeGreaterThan(0);
      const pose = () => page.locator("#lsystems .wildlife").evaluate((layer) => layer.innerHTML);
      const first = await pose();
      await page.waitForTimeout(1000);
      expect(await pose()).toBe(first);
    });
  });
});
