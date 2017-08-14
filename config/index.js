// see http://vuejs-templates.github.io/webpack for documentation.
var path = require('path')

function resolve(dir) {
  return path.join(__dirname, '..', dir)
}

module.exports = {
  build: {
    env: require('./prod.env'),
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    // assetsResources: path.resolve(__dirname, '../src/renderer/assets/stylesheets/custom_variables.scss'),
    productionSourceMap: true,

    // Run the build command with an extra argument to
    // View the bundle analyzer report after build finishes:
    // `npm run build --report`
    // Set to `true` or `false` to always turn it on or off
    bundleAnalyzerReport: process.env.npm_config_report,
    web: {
      index: resolve('dist/web/index.html'),
      assetsRoot: resolve('dist/web'),
      // Gzip off by default as many popular static hosts such as
      // Surge or Netlify already gzip all static assets for you.
      // Before setting to `true`, make sure to:
      // npm install --save-dev compression-webpack-plugin
      productionGzip: false,
      productionGzipExtensions: ['js', 'css']
    },
    electron: {
        index: resolve('dist/electron/index.html'),
        assetsRoot: resolve('dist/electron'),
        // Gzip off by default as many popular static hosts such as
        // Surge or Netlify already gzip all static assets for you.
        // Before setting to `true`, make sure to:
        // npm install --save-dev compression-webpack-plugin
        //
        // since the host would be electron itself, gzip first
        productionGzip: true,
        productionGzipExtensions: ['js', 'css']
    }
  },
  dev: {
    env: require('./dev.env'),
    port: 8080,
    autoOpenBrowser: true,
    assetsSubDirectory: 'static',
    // assetsResources: path.resolve(__dirname, '../src/renderer/assets/stylesheets/custom_variables.scss'),
    assetsPublicPath: '/',
    // proxyTable: {
    //   '/api': {
    //     target: 'http://localhost:8081/' // refers to local ppj-core rails app
    //   }
    // },
    // CSS Sourcemaps off by default because relative paths are "buggy"
    // with this option, according to the CSS-Loader README
    // (https://github.com/webpack/css-loader#sourcemaps)
    // In our experience, they generally work as expected,
    // just be aware of this issue when enabling this option.
    cssSourceMap: false
  }
}
