const { chromium } = require("@playwright/test");

module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: ["/", "/science-and-math-as-influence/"],
      numberOfRuns: 1,
      chromePath: process.env.CHROME_PATH || chromium.executablePath(),
      settings: { chromeFlags: "--headless=new --no-sandbox" },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 1 }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
