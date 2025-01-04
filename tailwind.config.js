/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./_data/**/*.yml", "./_includes/**/*.{html,svg}", "./assets/js/default.js", "./_layouts/**/*.html", "./_works/**/*.md", "*.html"],
  plugins: [require("daisyui")],
  theme: {
    extend: {
      fontFamily: {
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
        "primary-low-contrast": "oklch(var(--primary-low-contrast) / <alpha-value>)",
        "primary-high-contrast": "oklch(var(--primary-high-contrast) / <alpha-value>)",
        "secondary-low-contrast": "oklch(var(--secondary-low-contrast) / <alpha-value>)",
        "secondary-high-contrast": "oklch(var(--secondary-high-contrast) / <alpha-value>)",
        "accent-low-contrast": "oklch(var(--accent-low-contrast) / <alpha-value>)",
        "accent-high-contrast": "oklch(var(--accent-high-contrast) / <alpha-value>)",
        "neutral-100": "oklch(var(--neutral-100) / <alpha-value>)",
        "neutral-200": "oklch(var(--neutral-200) / <alpha-value>)",
        "neutral-300": "oklch(var(--neutral-300) / <alpha-value>)",
        "card-color": "oklch(var(--card-color) / <alpha-value>)",
        "card-shadow": "oklch(var(--card-shadow) / <alpha-value>)",
        "header-ray": "oklch(var(--header-ray) / <alpha-value>)",
        "btn-action": "oklch(var(--btn-action) / <alpha-value>)",
        "btn-action-outline": "oklch(var(--btn-action-outline) / <alpha-value>)",
        "btn-action-content": "oklch(var(--btn-action-content) / <alpha-value>)",
        "logo-icons": "oklch(var(--logo-icons) / <alpha-value>)",
        "call-to-action": "oklch(var(--call-to-action) / <alpha-value>)",
        "call-to-action-outline": "oklch(var(--call-to-action-outline) / <alpha-value>)",
        "service-icon": "oklch(var(--service-icon) / <alpha-value>)",
        "service-icon-hover": "oklch(var(--service-icon-hover) / <alpha-value>)",
        "service-icon-container": "oklch(var(--service-icon-container) / <alpha-value>)",
        "service-icon-container-hover": "oklch(var(--service-icon-container-hover) / <alpha-value>)",
        "award-icon": "oklch(var(--award-icon) / <alpha-value>)",
        "award-sparkle": "oklch(var(--award-sparkle) / <alpha-value>)",
        "award-title": "oklch(var(--award-title) / <alpha-value>)",
        "link-hover": "oklch(var(--link-hover) / <alpha-value>)",
        "status-indicator": "oklch(var(--status-indicator) / <alpha-value>)",
      },
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          primary: "#7dd3fc", // sky-300
          "primary-content": "#010100",
          "--primary-low-contrast": "95.14% 0.025 236.82", // sky-100
          "--primary-high-contrast": "68.47% 0.1479 237.32", // sky-500
          secondary: "#a5b4fc", // indigo-300
          "secondary-content": "#010100",
          "--secondary-low-contrast": "92.99% 0.0334 272.79", // indigo-100
          "--secondary-high-contrast": "58.54% 0.2041 277.12", // indigo-500
          accent: "#c4b5fd", // violet-300
          "accent-content": "#010100",
          "--accent-low-contrast": "94.33% 0.0284 294.59", // violet-100
          "--accent-high-contrast": "71.44% 0.1517 293.57",
          neutral: "#FFFFFF",
          "neutral-content": "#010100",
          "base-100": "#F6F7FF",
          "base-200": "#E1E6FF",
          "base-300": "#FFFFFF",
          "base-content": "#010100",
          info: "#a5f3fc", // cyan-200
          "info-content": "#010100",
          success: "#bef264", // lime-300
          "success-content": "#010100",
          warning: "#fcd34d", // amber-300
          "warning-content": "#010100",
          error: "#f87171", // red-400
          "error-content": "#010100",
          // extended color classes in oklch() values
          "--neutral-100": "6.51% 0.0141 109.77", // #010100
          "--neutral-200": "24.23% 0.0468 271.89", // #181e36
          "--neutral-300": "55.6% 0.0742 274.52", // #66709f
          "--card-color": "97.77% 0.0107 280.48", // #F6F7FF
          "--card-shadow": "92.87% 0.0343 276.72", // #E1E6FF
          "--header-ray": "97.77% 0.0107 280.48", // #F6F7FF
          "--btn-action": "6.51% 0.0141 109.77", // #010100
          "--btn-action-outline": "24.23% 0.0468 271.89", // #181e36
          "--btn-action-content": "97.77% 0.0107 280.48", // #F6F7FF
          "--logo-icons": "93.77% 0.0247 276.72", // #e6e9fb
          "--call-to-action": "68.47% 0.1479 237.32", // sky-500
          "--call-to-action-outline": "93.77% 0.0247 276.72", // #e6e9fb
          "--service-icon": "68.47% 0.1479 237.32",
          "--service-icon-hover": "97.77% 0.0107 280.48", // #F6F7FF
          "--service-icon-container": "95.14% 0.025 236.82",
          "--service-icon-container-hover": "82.76% 0.1013 230.32", // sky-300
          "--award-icon": "82.76% 0.1013 230.32", // sky-300
          "--award-sparkle": "90.15% 0.0729 70.7", // orange-200
          "--award-title": "68.47% 0.1479 237.32", // sky-500
          "--link-hover": "68.47% 0.1479 237.32", // sky-500
          "--status-indicator": "82.76% 0.1013 230.32", // sky-300
        },
      },
      {
        dark: {
          primary: "#7dd3fc", // sky-300
          "primary-content": "#010100",
          "--primary-low-contrast": "39.12% 0.0845 240.88", // sky-900
          "--primary-high-contrast": "82.76% 0.1013 230.32", // sky-100
          secondary: "#fdba74", // orange-300
          "secondary-content": "#010100",
          "--secondary-low-contrast": "40.84% 0.1165 38.17", // orange-900
          "--secondary-high-contrast": "83.66% 0.1165 66.29", // orange-100
          accent: "#f9a8d4", // pink-300
          "accent-content": "#010100",
          "--accent-low-contrast": "29.32% 0.1309 325.66", // pink-900
          "--accent-high-contrast": "82.28% 0.1095 346.02", // pink-200
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
          "--header-ray": "56.23% 0.0724 274.41", // #565F89
          "--btn-action": "6.51% 0.0141 109.77", // #010100
          "--btn-action-outline": "21.81% 0.0363 271.32", // #14192B
          "--btn-action-content": "97.77% 0.0107 280.48", // #F6F7FF
          "--logo-icons": "21.81% 0.0363 271.32", // #14192B
          "--call-to-action": "17.33% 0.0154 266.68", // #0d1017
          "--call-to-action-outline": "21.81% 0.0363 271.32", // #14192B
          "--service-icon": "97.77% 0.0107 280.48", // #F6F7FF
          "--service-icon-hover": "97.77% 0.0107 280.48", // #F6F7FF
          "--service-icon-container": "21.81% 0.0363 271.32",
          "--service-icon-container-hover": "24.23% 0.0468 271.89", // #181e36
          "--award-icon": "95.42% 0.0372 75.16", // orange-100
          "--award-sparkle": "95.42% 0.0372 75.16", // orange-100
          "--award-title": "83.66% 0.1165 66.29", // orange-100
          "--link-hover": "97.77% 0.0107 280.48", // #F6F7FF
          "--status-indicator": "82.76% 0.1013 230.32", // sky-300
        },
      },
    ],
  },
  darkMode: ["class", '[data-theme="dark"]'],
};
