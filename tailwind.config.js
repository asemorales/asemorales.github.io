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
        dark: {
          "primary": "#7dd3fc",
          "primary-content": "#0D1017",
          "secondary": "#fdba74",
          "secondary-content": "#0D1017",
          "accent": "#6ee7b7",
          "accent-content": "#0D1017",
          "neutral": "#0D1017",          
          "neutral-content": "#E1E6FF",
          "base-100": "#0D1017",
          "base-200": "#14192B",
          "base-300": "#181E36",
          "base-content": "#E1E6FF",
          "info": "#67e8f9",
          "info-content": "#000a16",
          "success": "#bef264",
          "success-content": "#000904",
          "warning": "#fcd34d",
          "warning-content": "#160300",
          "error": "#f87171",
          "error-content": "#160404",
        },
      },
    ],
  },
  plugins: [
    require('daisyui'),
  ],
}

