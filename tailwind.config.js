/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  darkMode: 'selector',
  content: [
    './_data/**/*.yml',
    './_includes/**/*.html',
    './_includes/**/*.svg',
    './_layouts/**/*.html',
    '*.html',
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
          "secondary": "#a5b4fc", // indigo-300
          "secondary-content": "#0D1017",
          "accent": "#5eead4", // teal-300
          "accent-content": "#0D1017",
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
          "secondary": "#fdba74", // orange-300
          "secondary-content": "#E1E6FF",
          "accent": "#6ee7b7", // emerald-300
          "accent-content": "#E1E6FF",
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
  plugins: [
    require('daisyui'),
  ],
}

