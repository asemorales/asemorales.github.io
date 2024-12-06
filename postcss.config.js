const path = require('path');

module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-url': {
      url: 'copy',
      basePath: path.resolve('node_modules/remixicon/fonts'),
      assetsPath: 'assets/remixicon',
    },
    tailwindcss: {},
  }
}