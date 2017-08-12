'use strict'

process.env.BABEL_ENV = 'web'

const path = require('path')
// const { dependencies } = require('../package.json')
const webpack = require('webpack')
const merge = require('webpack-merge')

const BabiliWebpackPlugin = require('babili-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')

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
    web: resolve('src/renderer/main.js')
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
        include: [resolve('src/renderer'), resolve('test')]
      },
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
      nodeModules: false
    })
  ],
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath: process.env.NODE_ENV === 'production' ?
      config.build.assetsPublicPath : config.dev.assetsPublicPath
  },
  target: 'web'
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
    new webpack.NoEmitOnErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      chunks: ['web'],
      filename: 'index.html',
      template: resolve('src/index.ejs'),
      inject: true,
      nodeModules: false
    }),
    new FriendlyErrorsPlugin()
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
      to: path.join(__dirname, '../dist/web/static'),
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
}

module.exports = rendererConfig
