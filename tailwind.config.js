/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './_data/**/*.yml',
    './_includes/**/*.html',
    './_includes/**/*.svg',
    './_layouts/**/*.html',
    '*.html',
  ],
  plugins: [
    require('daisyui'),
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        xsm: '0.7rem'
      },
      colors: {
        'musubi': {
          50: '#F1F3FF',
          100: '#E1E6FF',
          200: '#9AA5CE',
          300: '#565F89',
          400: '#181E36',
          500: '#14192B',
          600: '#0D1017',
        },
        // extend DaisyUI color classes
        'primary-low-contrast': "oklch(var(--primary-low-contrast) / <alpha-value>)",
        'primary-high-contrast': "oklch(var(--primary-high-contrast) / <alpha-value>)",
        'secondary-low-contrast': "oklch(var(--secondary-low-contrast) / <alpha-value>)",
        'secondary-high-contrast': "oklch(var(--secondary-high-contrast) / <alpha-value>)",
        'accent-low-contrast': "oklch(var(--accent-low-contrast) / <alpha-value>)",
        'accent-high-contrast': "oklch(var(--accent-high-contrast) / <alpha-value>)",
        'neutral-100': "oklch(var(--neutral-100) / <alpha-value>)",
        'neutral-200': "oklch(var(--neutral-200) / <alpha-value>)",
        'neutral-300': "oklch(var(--neutral-300) / <alpha-value>)",
      }
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#7dd3fc", // sky-300
          "primary-content": "#0D1017",
          "--primary-low-contrast": "95.14% 0.025 236.82", // sky-100
          "--primary-high-contrast": "68.47% 0.1479 237.32", // sky-500
          "secondary": "#a5b4fc", // indigo-300
          "secondary-content": "#0D1017",
          "--secondary-low-contrast": "92.99% 0.0334 272.79", // indigo-100
          "--secondary-high-contrast": "58.54% 0.2041 277.12", // indigo-500
          "accent": "#c4b5fd", // violet-300
          "accent-content": "#0D1017",
          "--accent-low-contrast": "94.33% 0.0284 294.59", // violet-100
          "--accent-high-contrast": "71.44% 0.1517 293.57",
          "neutral": "#FFFFFF",
          "neutral-content": "#0D1017",
          "base-100": "#F6F7FF",
          "base-200": "#FFFFFF",
          "base-300": "#FFFFFF",
          "base-content": "#0D1017",
          "info": "#a5f3fc", // cyan-200
          "info-content": "#0D1017",
          "success": "#bef264", // lime-300
          "success-content": "#0D1017",
          "warning": "#fcd34d", // amber-300
          "warning-content": "#0D1017",
          "error": "#f87171", // red-400
          "error-content": "#0D1017",
          // extended color classes in oklch() values
          "--neutral-100": "49.55% 0.0682 274.37", // #565F89
          "--neutral-200": "49.55% 0.0682 274.37", // #565F89
          "--neutral-300": "72.76% 0.0609 273.09", // #9AA5CE
        }
      },
      {
        dark: {
          "primary": "#7dd3fc", // sky-300
          "primary-content": "#E1E6FF",
          "--primary-low-contrast": "39.12% 0.0845 240.88", // sky-900
          "--primary-high-contrast": "82.76% 0.1013 230.32", // sky-100
          "secondary": "#fdba74", // orange-300
          "secondary-content": "#E1E6FF",
          "--secondary-low-contrast": "40.84% 0.1165 38.17", // orange-900
          "--secondary-high-contrast": "83.66% 0.1165 66.29", // orange-100
          "accent": "#f9a8d4", // pink-300
          "accent-content": "#E1E6FF",
          "--accent-low-contrast": "29.32% 0.1309 325.66", // pink-900
          "--accent-high-contrast": "82.28% 0.1095 346.02", // pink-200
          "neutral": "#0D1017",
          "neutral-content": "#E1E6FF",
          "base-100": "#0D1017",
          "base-200": "#14192B",
          "base-300": "#181E36",
          "base-content": "#E1E6FF",
          "info": "#67e8f9", // cyan-300
          "info-content": "#E1E6FF",
          "success": "#bef264", // lime-300
          "success-content": "#E1E6FF",
          "warning": "#fcd34d", // amber-300
          "warning-content": "#E1E6FF",
          "error": "#f87171", // red-400
          "error-content": "#E1E6FF",
          // extended color classes in oklch() values
          "--neutral-100": "92.87% 0.0343 276.72", // #E1E6FF
          "--neutral-200": "72.76% 0.0609 273.09", // #9AA5CE
          "--neutral-300": "49.55% 0.0682 274.37", // #565F89
        },
      },
    ],
  },
  darkMode: ['class', '[data-theme="dark"]'],
}

