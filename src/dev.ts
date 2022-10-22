import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import FastifyStatic from '@fastify/static'
import Fastify, { FastifyInstance } from 'fastify'
import middie from '@fastify/middie'
import checker from 'vite-plugin-checker'
import Inspect from 'vite-plugin-inspect'
import { isEqual } from 'lodash-es'
// @ts-ignore
import { start } from './lib/restartable.js'
import { createServer } from 'vite'

// The library dir
const __dirname = path.dirname(fileURLToPath(import.meta.url))
import { globby } from 'globby'

import { parseFilePathToRoutePath, routeMethods } from './lib/parseRoutes.js'

import { fastifyOpts } from './shared.js'
const root = process.cwd()

export async function createDevServer() {
  // @ts-ignore
  let app, stop, restart, listen

  // Find all the routes
  let routePaths = await globby(root + '/routes/**/*.{ts,tsx,js,jsx}')

  let vite = await createServer({
    configFile: path.resolve(__dirname + '/../vite.config.ts'),
    plugins: [
      Inspect(),
      {
        name: 'route-watcher',
        async handleHotUpdate({ file, modules, read }) {
          if (file.startsWith(root + '/routes/')) {
            console.time('Rebooting Fastify server')
            // @ts-ignore
            await restart(restartableOpts)
            console.timeEnd('Rebooting Fastify server')
          }
        },
      },
    ],
  })

  // Create the Fastify app from app.ts
  let appLoader = (await vite.ssrLoadModule(__dirname + '/app.js')).createApp

  async function runAfterLoad(app: FastifyInstance) {
    // Render helper is called dynamically
    // TODO: dynamically add renderFragment too
    app.decorateReply('render', null)

    for (let i = 0; i < routePaths.length; i++) {
      let filePath = routePaths[i]
      // Load the route file
      await vite.ssrLoadModule(filePath).then((module) => {
        // Transform the file path to a Fastify route path config
        let path = parseFilePathToRoutePath(filePath, root)

        routeMethods.forEach((method) => {
          if (module[method]) {
            // TODO: Add dynamic error handler/other functions
            // @ts-ignore
            let dynamicHandler = async function (req, res) {
              const newModule = await vite.ssrLoadModule(filePath)
              const newHandler = newModule[method].handler
              return await newHandler(req, res)
            }

            // @ts-ignore
            app[method](path, { ...module[method], handler: dynamicHandler })
          }
        })
      })
    }

    app.addHook('onRequest', async (req, reply) => {
      let { url } = req.raw

      if (url) {
        let templateHtml = fs.readFileSync(path.resolve(root + '/index.html'), 'utf-8')

        let template = await vite.transformIndexHtml(url, templateHtml)
        let { renderRoute } = await vite.ssrLoadModule(path.resolve(__dirname + '/lib/view/render.jsx'))

        // @ts-ignore
        reply.render = async function (options) {
          let result = await renderRoute(options, req, reply, template)
          return this.html(result)
        }
      }

      return
    })
  }

  async function rootAppHook(app: FastifyInstance) {
    console.log('registering')
    await app.register(middie)
    app.use(vite.middlewares)
    console.log('done registering')
  }

  const restartableOpts = {
    runAfterLoad,
    rootAppHook,
    app: appLoader,
    hostname: '127.0.0.1',
    port: 3000,

    ...fastifyOpts,
  }

  // @ts-ignore
  restartableOpts.logger.transport = {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  }

  let restartable = await start(restartableOpts)

  stop = restartable.stop
  restart = restartable.restart
  listen = restartable.listen
  app = restartable.app

  return { app, vite, listen }
}
