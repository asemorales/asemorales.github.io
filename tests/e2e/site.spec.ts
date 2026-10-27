import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/about/", "/lorem-ipsum/", "/tags/test/", "/404.html"];
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

    test(`${path} has a social image`, async ({ page, request }) => {
      await page.goto(path);
      const url = new URL((await page.locator('meta[property="og:image"]').getAttribute("content")) ?? "");
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", url.href);
      const res = await request.get(url.pathname);
      expect(res.ok()).toBe(true);
      expect(res.headers()["content-type"]).toBe("image/png");
    });
  }

  test("notes get their own social image", async ({ page }) => {
    await page.goto("/lorem-ipsum/");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/lorem-ipsum\/og\.png$/);
  });
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
    expect(await family("#typography + p")).toMatch(/^"?Source Serif 4"?,/);
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

test.describe("homepage", () => {
  test("shows one painting per room and downloads only that one", async ({ page }) => {
    for (const [scheme, painting, other] of [
      ["light", "lake-lucerne", "sierra-nevada"],
      ["dark", "sierra-nevada", "lake-lucerne"],
    ] as const) {
      const requested: string[] = [];
      page.on("request", (r) => requested.push(r.url()));
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      expect(await page.locator(".painting").evaluate((el) => getComputedStyle(el).backgroundImage)).toContain(painting);
      expect(new Set(requested.filter((u) => u.includes("bierstadt-"))).size).toBe(1);
      expect(requested.some((u) => u.includes(other))).toBe(false);
      page.removeAllListeners("request");
    }
  });

  test("follows a room picked against the system", async ({ page, javaScriptEnabled }) => {
    test.skip(javaScriptEnabled === false, "JS projects only");
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => localStorage.setItem("room", "dark"));
    await page.goto("/");
    expect(await page.locator(".painting").evaluate((el) => getComputedStyle(el).backgroundImage)).toContain("sierra-nevada");
  });

  test("filters the notes as you type, and shows them all without JS", async ({ page, javaScriptEnabled }) => {
    await page.goto("/");
    const items = page.locator(".home-notes li");
    test.skip((await items.count()) === 0, "needs a listed note");
    const search = page.locator(".home-search");
    if (javaScriptEnabled === false) {
      await expect(search).toBeHidden();
      for (const li of await items.all()) await expect(li).toBeVisible();
      return;
    }
    await expect(search).toBeVisible();
    const title = (await items.first().textContent())!.trim();
    await page.locator("#search").fill(title);
    await expect(items.first()).toBeVisible();
    await page.locator("#search").fill("zzzz-no-such-note");
    await expect(page.locator(".home-notes li:visible")).toHaveCount(0);
    await expect(page.locator(".search-empty")).toBeVisible();
  });

  test("links to About from every page", async ({ page }) => {
    for (const path of ["/", "/lorem-ipsum/", "/tags/test/"]) {
      await page.goto(path);
      await expect(page.locator('header a[href="/about/"]')).toBeVisible();
    }
  });
});

test.describe("feed", () => {
  test("is valid Atom, advertised on every page, and leaves unlisted notes out", async ({ page, request }) => {
    const res = await request.get("/feed.xml");
    expect(res.headers()["content-type"]).toContain("xml");
    const xml = await res.text();
    await page.goto("/");
    await expect(page.locator('link[rel="alternate"][type="application/atom+xml"]')).toHaveAttribute("href", "/feed.xml");
    const parsed = await page.evaluate((s) => {
      const doc = new DOMParser().parseFromString(s, "application/xml");
      return {
        error: doc.querySelector("parsererror")?.textContent ?? null,
        root: doc.documentElement.namespaceURI,
        self: doc.querySelector('link[rel="self"]')?.getAttribute("href"),
      };
    }, xml);
    expect(parsed).toEqual({ error: null, root: "http://www.w3.org/2005/Atom", self: "https://asemorales.com/feed.xml" });
    expect(xml).not.toContain("lorem-ipsum");
  });
});
