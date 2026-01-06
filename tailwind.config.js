/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./_data/**/*.yml", "./_includes/**/*.{html,svg}", "./assets/js/*.js", "./_layouts/**/*.html", "./_works/**/*.md", "*.html"],
  plugins: [require("daisyui")],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Newsreader", ...defaultTheme.fontFamily.serif],
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        xsm: "0.7rem",
      },
      colors: {
        musubi: {
          50: "#F1F3FF",
          100: "#E1E6FF",
          200: "#9AA5CE",
          300: "#565F89",
          400: "#181E36",
          500: "#14192B",
          600: "#010100",
        },
        // extend DaisyUI color classes
        "neutral-100": "oklch(var(--neutral-100) / <alpha-value>)",
        "neutral-200": "oklch(var(--neutral-200) / <alpha-value>)",
        "neutral-300": "oklch(var(--neutral-300) / <alpha-value>)",
        "card-color": "oklch(var(--card-color) / <alpha-value>)",
        "card-shadow": "oklch(var(--card-shadow) / <alpha-value>)",
        "btn-action": "oklch(var(--btn-action) / <alpha-value>)",
        "btn-action-outline": "oklch(var(--btn-action-outline) / <alpha-value>)",
        "btn-action-content": "oklch(var(--btn-action-content) / <alpha-value>)",
        "logo-icons": "oklch(var(--logo-icons) / <alpha-value>)",
        "award-icon": "oklch(var(--award-icon) / <alpha-value>)",
        "link-hover": "oklch(var(--link-hover) / <alpha-value>)",
      },
    },
  },
  daisyui: {
    themes: [
      {
        dark: {
          primary: "#7dd3fc", // sky-300
          secondary: "#fdba74", // orange-300
          accent: "#f9a8d4", // pink-300
          neutral: "#010100",
          "neutral-content": "#E1E6FF",
          "base-100": "#010100",
          "base-200": "#14192B",
          "base-300": "#181E36",
          "base-content": "#E1E6FF",
          info: "#A4F3FD",
          "info-content": "#E1E6FF",
          success: "#bef264", // lime-300
          "success-content": "#E1E6FF",
          warning: "#fcd34d", // amber-300
          "warning-content": "#E1E6FF",
          error: "#f87171", // red-400
          "error-content": "#E1E6FF",
          // extended color classes in oklch() values
          "--neutral-100": "92.87% 0.0343 276.72", // #E1E6FF
          "--neutral-200": "72.76% 0.0609 273.09", // #9AA5CE
          "--neutral-300": "56.23% 0.0724 274.41", // #565F89
          "--card-color": "17.33% 0.0154 266.68", // #0d1017
          "--card-shadow": "6.51% 0.0141 109.77", // #010100
          "--btn-action": "6.51% 0.0141 109.77", // #010100
          "--btn-action-outline": "21.81% 0.0363 271.32", // #14192B
          "--btn-action-content": "97.77% 0.0107 280.48", // #F6F7FF
          "--logo-icons": "21.81% 0.0363 271.32", // #14192B
          "--award-icon": "95.42% 0.0372 75.16", // orange-100
          "--link-hover": "97.77% 0.0107 280.48", // #F6F7FF
        },
      },
    ],
  },
  darkMode: ["class", '[data-theme="dark"]'],
};
