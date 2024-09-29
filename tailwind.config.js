/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode: 'class',
  content: [
    './_data/**/*.yml',
    './_includes/**/*.html',
    './_includes/**/*.svg',
    './_layouts/**/*.html',
    '*.html'
  ],
  theme: {
    extend: {
      colors: {
        'musubi': {
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

