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

    test(`${path} has a social image`, { tag: "@once" }, async ({ page, request }) => {
      await page.goto(path);
      const url = new URL((await page.locator('meta[property="og:image"]').getAttribute("content")) ?? "");
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", url.href);
      const res = await request.get(url.pathname);
      expect(res.ok()).toBe(true);
      expect(res.headers()["content-type"]).toBe("image/png");
    });
  }

  test("notes get their own social image", { tag: "@once" }, async ({ page }) => {
    await page.goto("/lorem-ipsum/");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/lorem-ipsum\/og\.png$/);
  });
});

test.describe("lorem ipsum page", () => {
  test("is built from the vault and kept private", { tag: "@once" }, async ({ page, request }) => {
    await page.goto("/lorem-ipsum/");
    await expect(page.locator("h1")).toHaveText("Lorem Ipsum");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    await expect(page.locator("article")).not.toContainText("Obsidian comments like this one");

    await page.goto("/");
    await expect(page.locator('.home-notes a[href="/lorem-ipsum/"]')).toHaveCount(0);
    await expect(page.locator(".home-title p")).toHaveCount(0);

    const sitemap = await (await request.get("/sitemap-0.xml")).text();
    expect(sitemap).not.toContain("lorem-ipsum");
    expect(sitemap).toContain("acknowledgments");
  });

  test("sets body text and headings in Source Serif 4", { tag: "@once" }, async ({ page }) => {
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
    await expect(page.locator(".theme-toggle:visible")).toBeHidden();
    await page.emulateMedia({ colorScheme: "light" });
    expect(await background(page)).toBe(LIGHT);
  });
});

test.describe("theme with JS", () => {
  test.skip(({ javaScriptEnabled }) => javaScriptEnabled === false, "JS projects only");

  test("cycles auto, light, and dark", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/lorem-ipsum/");
    const toggle = page.locator(".theme-toggle:visible");
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
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBeNull();
  });

  test("applies a saved theme before first paint", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/lorem-ipsum/");
    await page.evaluate(() => localStorage.setItem("theme", "light"));
    await page.addInitScript(() => {
      new MutationObserver((_, observer) => {
        if (!document.body) return;
        (window as unknown as { firstTheme?: string }).firstTheme = document.documentElement.dataset.theme;
        observer.disconnect();
      }).observe(document, { childList: true, subtree: true });
    });
    await page.reload();
    expect(await page.evaluate(() => (window as unknown as { firstTheme?: string }).firstTheme)).toBe("light");
    expect(await background(page)).toBe(LIGHT);
    await expect(page.locator(".theme-toggle:visible")).toContainText("light");
  });
});

test.describe("homepage", () => {
  test("filters the notes as you type, and shows them all without JS", async ({ page, javaScriptEnabled }) => {
    await page.goto("/");
    const items = page.locator(".home-notes :not(details) > ul > li");
    test.skip((await items.count()) === 0, "needs a listed note");
    const toggle = page.getByRole("button", { name: "Search" });
    if (javaScriptEnabled === false) {
      await expect(toggle).toBeHidden();
      for (const li of await items.all()) await expect(li).toBeVisible();
      return;
    }
    await toggle.click();
    await expect(page.locator("#search")).toBeFocused();
    const title = (await items.first().locator("a").textContent())!.trim();
    await page.locator("#search").fill(title);
    await expect(items.first()).toBeVisible();
    await page.locator("#search").fill("zzzz-no-such-note");
    await expect(page.locator(".home-notes li:visible")).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveText("No notes match.");
    await expect(page.locator(".home-empty")).toContainText("zzzz-no-such-note");
    await page.keyboard.press("Escape");
    await expect(page.locator("#search")).toBeHidden();
    await expect(items.first()).toBeVisible();
    await expect(page.locator(".home-empty")).toBeHidden();
  });

  test("graphs the notes, lights a note's row, and zooms", async ({ page, javaScriptEnabled }, info) => {
    await page.goto("/");
    const graph = page.getByRole("figure", { name: /^Graph of links between notes/ });
    const nodes = graph.locator("a:not(.external)");
    test.skip((await nodes.count()) === 0, "needs a listed note");
    await expect(nodes).toHaveCount(await page.locator(".home-notes section li").count());
    const zoomIn = graph.getByRole("button", { name: "Zoom in" });
    if (javaScriptEnabled === false) return await expect(zoomIn).toBeHidden();

    const node = nodes.first();
    const row = page.locator(`.home-notes section li:has(a[href="${await node.getAttribute("href")}"])`);
    await node.focus();
    await expect(row).toHaveClass(/lit/);
    await expect(node).toHaveClass(/lit/);
    if (info.project.name.startsWith("wide")) {
      await node.hover();
      await expect(page.locator("#link-popover .popover-title")).toHaveText((await row.locator("a").textContent())!);
    }
    await page.locator("#contents").click();
    await expect(row).not.toHaveClass(/lit/);

    const externals = graph.getByRole("button", { name: "Show external links" });
    if (await externals.count()) {
      await expect(graph.locator("a.external:visible")).toHaveCount(0);
      await externals.click();
      await expect(externals).toHaveAttribute("aria-pressed", "true");
      await expect(graph.locator("a.external").first()).toBeVisible();
    }

    const canvas = graph.locator(".graph-canvas");
    const { width } = (await canvas.boundingBox())!;
    await zoomIn.click();
    await zoomIn.click();
    const zoomed = async () => (await canvas.boundingBox())!.width;
    await expect.poll(zoomed).toBeGreaterThan(width * 2);
    await expect(graph).toHaveAttribute("data-labels");
    await page.keyboard.press("0");
    await expect.poll(zoomed).toBeCloseTo(width, 0);
  });

  test("links home once on every page but home", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Home", exact: true })).toHaveCount(0);
    for (const path of ["/lorem-ipsum/", "/tags/test/"]) {
      await page.goto(path);
      await expect(page.getByRole("link", { name: "Home", exact: true })).toBeVisible();
      await expect(page.locator("header").getByRole("link", { name: "Home", exact: true })).toHaveCount(0);
    }
  });

  test("redirects the old About page to the homepage introduction", async ({ page }) => {
    await page.goto("/about/");
    await expect(page).toHaveURL(/\/#introduction$/);
    await expect(page.locator("#introduction")).toBeVisible();
  });
});

test.describe("media modes", () => {
  test("print uses light colors under a saved dark theme", { tag: "@once" }, async ({ page }) => {
    await page.goto("/colophon/");
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.reload();
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  });

  test("icons keep their color in forced colors", { tag: "@once" }, async ({ page }) => {
    await page.goto("/colophon/");
    await page.emulateMedia({ forcedColors: "active" });
    const icon = page.locator(".site-home .icon");
    const color = await icon.evaluate((el) => getComputedStyle(el.parentElement!).color);
    await expect(icon).toHaveCSS("background-color", color);
  });
});

test.describe("feed", () => {
  test("the home field shows the URL and copies it on click", async ({ page, context, javaScriptEnabled, browserName }) => {
    await page.goto("/");
    const field = page.locator(".home-feed");
    await expect(field.getByRole("textbox", { name: "Atom feed URL" })).toHaveValue("https://asemorales.com/feed.xml");
    await expect(field.locator(".icon-rss")).toBeVisible();
    await expect(page.locator('head link[rel="me"]')).toHaveAttribute("href", "https://mathstodon.xyz/@ase");
    if (javaScriptEnabled === false) return await expect(field).not.toHaveAttribute("title");
    await expect(field).toHaveAttribute("title", "Click to copy feed URL");
    if (browserName !== "chromium") return;
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await field.click();
    await expect(field).toHaveAttribute("data-copied", "true");
    await expect(field.locator(".icon-check")).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("https://asemorales.com/feed.xml");
  });

  test("is valid Atom, is advertised on every page, and omits unlisted notes", { tag: "@once" }, async ({ page, request }) => {
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
    expect(xml).not.toContain("acknowledgments");
    expect(xml).not.toContain("lorem-ipsum");
  });
});
