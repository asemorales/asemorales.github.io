module.exports = {
  plugins: {
    "postcss-import": {},
    "tailwindcss/nesting": {},
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? {
      "@fullhuman/postcss-purgecss": {
        content: ['./**/*.yml', './**/*.html', './assets/js/default.js'],
        css: ['./assets/css/compiled.min.css'],
        defaultExtractor: (content) => content.match(/[\w\-:\>.\/\[#%\]]+(?<!:)/g) || [],
        output: './assets/css/compiled.min.css',
      },
      cssnano: {}
    } : {})
  },
};
