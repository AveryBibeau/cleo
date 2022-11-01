import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { FastifyInstance } from 'fastify'
import middie from '@fastify/middie'
import Inspect from 'vite-plugin-inspect'
// @ts-ignore
import { start } from './lib/restartable.js'
import { createServer } from 'vite'
import { inspect } from 'util'

import { includeCleo } from './lib/includes.js'
import { fastifyRequestContextPlugin } from '@fastify/request-context'

// The library dir
const __dirname = path.dirname(fileURLToPath(import.meta.url))
import { globby } from 'globby'

import { createRouteIncludes, parseFilePathToRoutePath, parseRoutePathToName, routeMethods } from './lib/parseRoutes.js'

import { fastifyOpts } from './shared.js'
import { createRouterConfig } from './lib/routes.js'
const root = process.cwd()
import { debounce } from 'lodash-es'

async function initializeRoutes() {
  // Create the initial includes files
  // Find all the routes
  let routeFilePaths = await globby([
    root + '/routes/**/*.{ts,tsx,js,jsx}',
    '!' + root + '/routes/**/_*.{ts,tsx,js,jsx}',
  ])
  let { routeOptionsString, routeDefinitionsString } = createRouteIncludes(routeFilePaths, root)
  await includeCleo({ routeDefinitions: routeDefinitionsString, routeOptions: routeOptionsString })

  return routeFilePaths
}

export async function createDevServer() {
  // @ts-ignore
  let app, stop, restart, listen

  // Load the initial includes files
  await initializeRoutes()

  const restartFastify = debounce(async function () {
    console.time('Rebooting Fastify server')
    // @ts-ignore
    await restart(restartableOpts)
    console.timeEnd('Rebooting Fastify server')
  }, 50)

  let vite = await createServer({
    configFile: path.resolve(__dirname + '/../vite.config.ts'),
    plugins: [
      // @ts-ignore
      Inspect(),
      {
        name: 'route-watcher',
        configureServer(server) {
          server.watcher.add('/routes/**/*.{ts,tsx,js,jsx}')
          console.log({ root })
          /**
           * Note: Unlink/add are triggered simultaneously when renaming a file leading to
           * two restarts, so the restart function here is debounced
           **/
          server.watcher.on('add', async (file) => {
            console.log('add', { file })
            if (file.startsWith(root + '/routes/')) await restartFastify()
          })
          server.watcher.on('change', async (file) => {
            console.log('change', { file })
            if (file.startsWith(root + '/routes/')) await restartFastify()
          })
          server.watcher.on('unlink', async (file) => {
            console.log('unlink', { file })
            if (file.startsWith(root + '/routes/')) await restartFastify()
          })
        },
      },
    ],
  })

  // Create the Fastify app from app.ts
  let appLoader = (await vite.ssrLoadModule(__dirname + '/app.js')).createApp

  async function runAfterLoad(app: FastifyInstance) {
    // Reload the route files and update the includes files
    let routeFilePaths = await initializeRoutes()

    // Render helper is called dynamically
    // TODO: dynamically add renderFragment too?
    app.decorateReply('render', null)

    for (let i = 0; i < routeFilePaths.length; i++) {
      let filePath = routeFilePaths[i]
      // Load the route file
      await vite.ssrLoadModule(filePath).then((module) => {
        // Transform the file path to a Fastify route path config
        let path = parseFilePathToRoutePath(filePath, root)

        routeMethods.forEach((method) => {
          if (module[method]) {
            // TODO: Add dynamic error handler/other functions?
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
        let { renderRoute } = await vite.ssrLoadModule(path.resolve(__dirname + '/lib/view/render.js'))

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
    // @ts-ignore
    await app.register(middie)
    app.use(vite.middlewares)

    app.register(fastifyRequestContextPlugin, {})

    app.addHook('onRequest', async (req, reply) => {
      // @ts-ignore
      console.log(req.routerPath)
      let url = new URL(req.protocol + '://' + req.hostname + req.url)

      req.requestContext.set('route', {
        url,
        params: (req.params ?? {}) as Record<string, any>,
      })

      return
    })
  }

  const restartableOpts = {
    runAfterLoad,
    rootAppHook,
    app: appLoader,
    hostname: '127.0.0.1',
    port: 3000,
    ssrFixStacktrace: vite.ssrFixStacktrace,
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
