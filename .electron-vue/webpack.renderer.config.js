'use strict'

process.env.BABEL_ENV = 'renderer'

const path = require('path')
// const { dependencies } = require('../package.json')
const webpack = require('webpack')
const merge = require('webpack-merge')

const BabiliWebpackPlugin = require('babili-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const config = require('../config')
const utils = require('./utils')
const vueLoaderConfig = require('./vue-loader.conf')

function resolve(dir) {
  return path.join(__dirname, '..', dir)
}

/**
 * List of node_modules to include in webpack bundle
 *
 * Required for specific packages like Vue UI libraries
 * that provide pure *.vue files that need compiling
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals
 */
// let whiteListedModules = ['vue']

let rendererConfig = {
  devtool: '#cheap-module-eval-source-map',
  entry: {
    renderer: resolve('src/renderer/main.js')
  },
  // externals: [
  //   ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d))
  // ],
  resolve: {
    alias: {
      '@': resolve('src/renderer'),
      'vue$': 'vue/dist/vue.esm.js'
    },
    extensions: ['.js', '.vue', '.json']
  },
  module: {
    rules: [{
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [resolve('src/renderer'), resolve('test')],
        options: {
          formatter: require('eslint-friendly-formatter')
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: vueLoaderConfig
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('src/renderer'), resolve('test')],
        options: {
          plugins: [
            // use to get rid of code spliting with webpack, which might used in web.config
            // check https://gist.github.com/jcenturion/892c718abce234243a156255f8f52468
            'dynamic-import-webpack',
            'remove-webpack'
          ]
        }
      },
      //   {
      //     test: /\.node$/,
      //     use: 'node-loader'
      //   },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: utils.assetsPath('img/[name].[hash:7].[ext]')
          }
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
          }
        }
      }
    ]
  },
  // node: {
  //   __dirname: process.env.NODE_ENV !== 'production',
  //   __filename: process.env.NODE_ENV !== 'production'
  // },
  plugins: [
    // new ExtractTextPlugin('styles.css'),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: resolve('src/index.ejs'),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true
      },
      nodeModules: process.env.NODE_ENV !== 'production' ?
        path.resolve(__dirname, '../node_modules') : false
    })
    // new webpack.HotModuleReplacementPlugin(),
    // new webpack.NoEmitOnErrorsPlugin()
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: resolve('dist/electron')
  },
  target: 'electron-renderer'
}

/**
 * Adjust rendererConfig for development settings
 */
let rendererDevConfig = {
  plugins: [
    new webpack.DefinePlugin({
      '__static': `"${path.join(__dirname, '../static').replace(/\\/g, '\\\\')}"`,
      'process.env': config.dev.env
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  module: {
    rules: utils.styleLoaders({
      sourceMap: config.dev.cssSourceMap
    })
  }
}

/**
 * Adjust rendererConfig for production settings
 */
let rendererProdConfig = {
  devtool: config.build.productionSourceMap ? '#source-map' : false,
  module: {
    rules: utils.styleLoaders({
      sourceMap: config.build.productionSourceMap,
      extract: true
    })
  },
  output: {
    path: config.build.electron.assetsRoot,
    filename: utils.assetsPath('js/[name].[chunkhash].js'),
    chunkFilename: utils.assetsPath('js/[name].[chunkhash].js')
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': config.build.env
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      sourceMap: true
    }),
    // extract css into its own file
    new ExtractTextPlugin({
      filename: utils.assetsPath('css/[name].[contenthash].css')
    }),
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSPlugin({
      cssProcessorOptions: {
        safe: true
      }
    }),
    // split vendor js into its own file
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: function (module, count) {
        // any required modules inside node_modules are extracted to vendor
        return (
          module.resource &&
          /\.js$/.test(module.resource) &&
          module.resource.indexOf(
            path.join(__dirname, '../node_modules')
          ) === 0
        )
      }
    }),
    // extract webpack runtime and module manifest to its own file in order to
    // prevent vendor hash from being updated whenever app bundle is updated
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      chunks: ['vendor']
    }),
    new BabiliWebpackPlugin({
      removeConsole: true,
      removeDebugger: true
    }),
    new CopyWebpackPlugin([{
      from: path.join(__dirname, '../static'),
      to: path.join(__dirname, '../dist/electron/static'),
      ignore: ['.*']
    }]),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ]
}


if (process.env.NODE_ENV !== 'production') {
  rendererConfig = merge(rendererConfig, rendererDevConfig)
}
if (process.env.NODE_ENV === 'production') {
  rendererConfig = merge(rendererConfig, rendererProdConfig)

  if (config.build.electron.productionGzip) {
    var CompressionWebpackPlugin = require('compression-webpack-plugin')

    rendererConfig.plugins.push(
      new CompressionWebpackPlugin({
        asset: '[path].gz[query]',
        algorithm: 'gzip',
        test: new RegExp(
          '\\.(' +
          config.build.electron.productionGzipExtensions.join('|') +
          ')$'
        ),
        threshold: 10240,
        minRatio: 0.8
      })
    )
  }

  if (config.build.bundleAnalyzerReport) {
    var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
    rendererConfig.plugins.push(new BundleAnalyzerPlugin())
  }
}

module.exports = rendererConfig
