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
  plugins: [],
}

