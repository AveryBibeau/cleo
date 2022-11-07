import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { start } from '@fastify/restartable'
import type { ViteDevServer } from 'vite'

import { includeCleo } from './lib/includes.js'

// The library dir
const __dirname = path.dirname(fileURLToPath(import.meta.url))
import { globby } from 'globby'

import { createRouteIncludes, parseFilePathToRoutePath, parseRoutePathToName, routeMethods } from './lib/parseRoutes.js'

import { fastifyOpts } from './shared.js'

const root = process.cwd()
import { debounce } from 'lodash-es'
import { RenderRouteOptions } from './lib/view/render.js'

// TODO: dedupe this with build plugin
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

export async function createDevServer(vite: ViteDevServer) {
  let app: FastifyInstance
  let restart: Awaited<ReturnType<typeof start>>['restart']
  let listen: Awaited<ReturnType<typeof start>>['listen']

  const restartFastify = debounce(async function (file: string) {
    if (!file.startsWith(root + '/routes/')) return
    console.time('Rebooting Fastify server')
    await restart()
    console.timeEnd('Rebooting Fastify server')
  }, 50)

  /**
   * Note: Unlink/add are triggered simultaneously when renaming a file leading to
   * two restarts, so the restart function here is debounced
   **/
  vite.watcher.on('add', restartFastify)
  vite.watcher.on('change', restartFastify)
  vite.watcher.on('unlink', restartFastify)

  // Create the Fastify app from app.ts
  let appLoader = (await vite.ssrLoadModule(__dirname + '/app.js')).createApp

  /**
   * This will be called every time the Fastify server is restarted due to route file changes
   */
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
            let dynamicHandler = async function (req: FastifyRequest, res: FastifyReply) {
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
        reply.render = async function (this: FastifyReply, options: RenderRouteOptions) {
          let result = await renderRoute(options, req, reply, template)
          return this.html(result)
        }
      }

      return
    })
  }

  vite.middlewares.use(async function (req, res, next) {
    await restartable.app.ready()
    return restartable.app.routing(req, res)
  })

  // TODO: Merge with user provided Fastify opts
  const restartableOpts = {
    runAfterLoad,
    app: appLoader,
    ssrFixStacktrace: vite.ssrFixStacktrace,
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
    ...fastifyOpts,
  }

  // @ts-ignore
  let restartable = await start(restartableOpts)

  restart = restartable.restart
  listen = restartable.listen
  app = restartable.app

  return { app, vite, listen }
}
