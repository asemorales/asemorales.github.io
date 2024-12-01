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
        }
      }
    },
  },
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#7dd3fc",
          "primary-content": "#E1E6FF",
          "secondary": "#c4b5fd",
          "secondary-content": "#E1E6FF",
          "accent": "#a5b4fc",
          "accent-content": "#E1E6FF",
          "neutral": "#FFFFFF",
          "neutral-content": "#E1E6FF",
          "base-100": "#F6F7FF",
          "base-200": "#FFFFFF",
          "base-300": "#FFFFFF",
          "base-content": "#E1E6FF",
          "info": "#a5f3fc",
          "info-content": "#E1E6FF",
          "success": "#bef264",
          "success-content": "#E1E6FF",
          "warning": "#fcd34d",
          "warning-content": "#E1E6FF",
          "error": "#f87171",
          "error-content": "#E1E6FF",
        }
      },
      {
        dark: {
          "primary": "#7dd3fc",
          "primary-content": "#E1E6FF",
          "secondary": "#fdba74",
          "secondary-content": "#E1E6FF",
          "accent": "#6ee7b7",
          "accent-content": "#E1E6FF",
          "neutral": "#0D1017",          
          "neutral-content": "#E1E6FF",
          "base-100": "#0D1017",
          "base-200": "#14192B",
          "base-300": "#181E36",
          "base-content": "#E1E6FF",
          "info": "#67e8f9",
          "info-content": "#E1E6FF",
          "success": "#bef264",
          "success-content": "#E1E6FF",
          "warning": "#fcd34d",
          "warning-content": "#E1E6FF",
          "error": "#f87171",
          "error-content": "#E1E6FF",
        },
      },
    ],
  },
  plugins: [
    require('daisyui'),
  ],
}

