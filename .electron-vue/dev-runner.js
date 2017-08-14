'use strict'

const chalk = require('chalk')
const electron = require('electron')
const opn = require('opn')
const path = require('path')
const express = require('express')
const { say } = require('cfonts')
const { spawn } = require('child_process')
const webpack = require('webpack')
// const proxyMiddleware = require('http-proxy-middleware')
const WebpackDevServer = require('webpack-dev-server')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')

const mainConfig = require('./webpack.main.config')
const rendererConfig = require('./webpack.renderer.config')

const config = require('../config')

let electronProcess = null
let backendProcess = null
let webProcess = null
let manualRestart = false
let hotMiddleware

function logStats(proc, data) {
  let log = ''

  log += chalk.yellow.bold(`┏ ${proc} Process ${new Array((19 - proc.length) + 1).join('-')}`)
  log += '\n\n'

  if (typeof data === 'object') {
    data.toString({
      colors: true,
      chunks: false
    }).split(/\r?\n/).forEach(line => {
      log += '  ' + line + '\n'
    })
  } else {
    log += `  ${data}\n`
  }

  log += '\n' + chalk.yellow.bold(`┗ ${new Array(28 + 1).join('-')}`) + '\n'

  console.log(log)
}

function startRenderer() {
  return new Promise((resolve, reject) => {
    rendererConfig.entry.renderer = [path.join(__dirname, 'dev-client')].concat(rendererConfig.entry.renderer)

    const compiler = webpack(rendererConfig)
    hotMiddleware = webpackHotMiddleware(compiler, {
      log: false,
      heartbeat: 2500
    })

    compiler.plugin('compilation', compilation => {
      compilation.plugin('html-webpack-plugin-after-emit', (data, cb) => {
        hotMiddleware.publish({ action: 'reload' })
        cb()
      })
    })

    compiler.plugin('done', stats => {
      logStats('Renderer', stats)
    })

    const server = new WebpackDevServer(
      compiler, {
        contentBase: path.join(__dirname, '../'),
        quiet: true,
        setup(app, ctx) {
          app.use(hotMiddleware)
          ctx.middleware.waitUntilValid(() => {
            resolve()
          })
        }
      }
    )

    server.listen(9080)
  })
}

function startWeb() {
  var webpackConfig = require('./webpack.web.config')

  // default port where dev server listens for incoming traffic
  var port = config.dev.port || 8080
  // automatically open browser, if not set will be false
  var autoOpenBrowser = !!config.dev.autoOpenBrowser
  // Define HTTP proxies to your custom API backend
  // https://github.com/chimurai/http-proxy-middleware
  // var proxyTable = config.dev.proxyTable
  var compiler = webpack(webpackConfig)
  var app = express()

  var devMiddleware = webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    quiet: true
  })

  var hotMiddleware = webpackHotMiddleware(compiler, {
    log: () => {}
  })

  // force page reload when html-webpack-plugin template changes
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
      hotMiddleware.publish({ action: 'reload' })
      cb()
    })
  })

  // proxy api requests
  // Object.keys(proxyTable).forEach(function (context) {
  //   var options = proxyTable[context]
  //   if (typeof options === 'string') {
  //     options = { target: options }
  //   }
  //   app.use(proxyMiddleware(options.filter || context, options))
  // })

  // handle fallback for HTML5 history API
  app.use(require('connect-history-api-fallback')())

  // serve webpack bundle output
  app.use(devMiddleware)

  // enable hot-reload and state-preserving
  // compilation error display
  app.use(hotMiddleware)

  // serve pure static assets
  var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
  app.use(staticPath, express.static('./static'))

  var uri = 'http://localhost:' + port

  var _resolve
  var readyPromise = new Promise(resolve => {
    _resolve = resolve
  })

  console.log('> Starting dev server...')
  devMiddleware.waitUntilValid(() => {
    console.log('> Listening at ' + uri + '\n')
    // when env is testing, don't need open it
    if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
      opn(uri)
    }
    _resolve()
  })

  webProcess = app.listen(port)
}

function startBackend() {

  backendProcess = spawn('node', [path.join(__dirname, '../src/backend/main.js')])

  backendProcess.stdout.on('data', data => {
    electronLog(data, 'blue')
  })

  backendProcess.stderr.on('data', data => {
    electronLog(data, 'red')
  })

  backendProcess.on('close', () => {
    console.log('backendProcess on close')
  })

}

function startMain() {
  return new Promise((resolve, reject) => {
    mainConfig.entry.main = [path.join(__dirname, '../src/main/index.dev.js')].concat(mainConfig.entry.main)

    const compiler = webpack(mainConfig)

    compiler.plugin('watch-run', (compilation, done) => {
      logStats('Main', chalk.white.bold('compiling...'))
      hotMiddleware.publish({ action: 'compiling' })
      done()
    })

    compiler.watch({}, (err, stats) => {
      if (err) {
        console.log(err)
        return
      }

      logStats('Main', stats)

      if (electronProcess && electronProcess.kill) {
        manualRestart = true
        process.kill(electronProcess.pid)
        electronProcess = null
        startElectron()

        setTimeout(() => {
          manualRestart = false
        }, 5000)
      }

      resolve()
    })
  })
}

function startElectron() {
  electronProcess = spawn(electron, ['--inspect=5858', path.join(__dirname, '../dist/electron/main.js')])

  electronProcess.stdout.on('data', data => {
    electronLog(data, 'blue')
  })
  electronProcess.stderr.on('data', data => {
    electronLog(data, 'red')
  })

  electronProcess.on('close', () => {
    if (!manualRestart) process.exit()
  })
}

function electronLog(data, color) {
  let log = ''
  data = data.toString().split(/\r?\n/)
  data.forEach(line => {
    log += `  ${line}\n`
  })
  if (/[0-9A-z]+/.test(log)) {
    console.log(
      chalk[color].bold('┏ Electron -------------------') +
      '\n\n' +
      log +
      chalk[color].bold('┗ ----------------------------') +
      '\n'
    )
  }
}

function greeting(text) {
  text = text || 'electron-vue'
  const cols = process.stdout.columns
  if (cols > 104) {
    say(text, {
      colors: ['yellow'],
      font: 'simple3d',
      space: false
    })
  } else console.log(chalk.yellow.bold('\n  ' + text))
  console.log(chalk.blue('  getting ready...') + '\n')
}

function electronInit() {
  greeting()

  startBackend()
  Promise.all([startRenderer(), startMain()])
    .then(() => {
      startElectron()
    })
    .catch(err => {
      console.error(err)
    })
}

function webInit() {
  greeting('web-vue')
  startBackend()
  startWeb()
}

if (process.env.DEV_TARGET === 'web') webInit()
else electronInit()
