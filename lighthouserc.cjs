// Lighthouse CI over the built site, using Playwright's Chromium.
const { chromium } = require("@playwright/test");

module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: ["/", "/about/", "/lorem-ipsum/"],
      numberOfRuns: 1,
      chromePath: process.env.CHROME_PATH || chromium.executablePath(),
      settings: { chromeFlags: "--headless=new --no-sandbox" },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        // The lorem page is noindex on purpose, which costs it the SEO points.
        "categories:seo": ["warn", { minScore: 1 }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
