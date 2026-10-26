import { defineConfig, devices } from "@playwright/test";

// Every test runs at two widths, with and without JS. Run `npm run build` first.
const wide = { viewport: { width: 1440, height: 900 } };

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:4321", trace: "retain-on-failure" },
  projects: [
    { name: "wide-js-chromium", use: { ...devices["Desktop Chrome"], ...wide } },
    { name: "wide-js-firefox", use: { ...devices["Desktop Firefox"], ...wide } },
    { name: "wide-nojs", use: { ...devices["Desktop Chrome"], ...wide, javaScriptEnabled: false } },
    { name: "phone-js", use: { ...devices["iPhone 15"] } },
    { name: "phone-nojs", use: { ...devices["iPhone 15"], javaScriptEnabled: false } },
  ],
  webServer: {
    // --ignore-lock keeps preview in the foreground, which Astro otherwise skips under coding agents.
    command: "npx astro preview --port 4321 --ignore-lock",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
});
