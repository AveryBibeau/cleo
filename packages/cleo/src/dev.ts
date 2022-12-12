import fs from 'fs'
import path from 'path'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { start } from '@fastify/restartable'
import type { ConfigEnv, ViteDevServer } from 'vite'

import { createRouteIncludes, parseFilePathToRoutePath, routeMethods } from './lib/parseRoutes.js'
import { root, __dirname } from './shared.js'
import { debounce } from 'lodash-es'
import { RenderRouteOptions } from './lib/view/render.js'
import { CleoConfig, DefineCleoConfigResolver } from './cleoConfig.js'
import { globby } from 'globby'
import { CleoTypeProviderOpts, includeCleo } from './lib/includes.js'

const routesGlob = [`${root}/routes/**/*.{ts,tsx,js,jsx}`, `!${root}/routes/**/_*.{ts,tsx,js,jsx}`]

async function initializeRoutes(typeProvider?: CleoTypeProviderOpts) {
  // Create the initial includes files
  // Find all the routes
  let routeFilePaths = await globby(routesGlob)
  let { routeOptionsString, routeDefinitionsString } = await createRouteIncludes(routeFilePaths, root)
  await includeCleo({ routeDefinitions: routeDefinitionsString, routeOptions: routeOptionsString, typeProvider })

  return routeFilePaths
}

export async function createDevServer(vite: ViteDevServer, configEnv: ConfigEnv, typeProvider?: CleoTypeProviderOpts) {
  let app: FastifyInstance
  let restart: Awaited<ReturnType<typeof start>>['restart']
  let listen: Awaited<ReturnType<typeof start>>['listen']

  // Load the Cleo config
  let cleoConfigModule = (await vite.ssrLoadModule('/cleo.config.ts')).default as DefineCleoConfigResolver | undefined
  let cleoConfig: CleoConfig
  if (typeof cleoConfigModule === 'function') cleoConfig = await cleoConfigModule({ isDev: true, prerender: false })
  else cleoConfig = cleoConfigModule ?? {}

  await initializeRoutes(typeProvider)

  /**
   * Note: Unlink/add are triggered simultaneously when renaming a file leading to
   * two restarts, so the restart function here is debounced
   **/
  const restartFastify = debounce(async function (file: string) {
    // TODO: Restart server on other file changes, e.g. cleo.config.ts?
    if (!file.startsWith(root + '/routes/')) return

    console.time('Rebooting Fastify server')
    await restart()
    console.timeEnd('Rebooting Fastify server')
  }, 50)

  vite.watcher.on('add', restartFastify)
  vite.watcher.on('change', restartFastify)
  vite.watcher.on('unlink', restartFastify)

  // Create the Fastify app from app.ts
  let appLoader = (await vite.ssrLoadModule(path.resolve(__dirname, './app.js'))).createApp

  /**
   * This will be called every time the Fastify server is restarted due to route file changes
   */
  async function runAfterLoad(app: FastifyInstance) {
    // Reload the route files and update the includes files
    let routeFilePaths = await initializeRoutes(typeProvider)

    // Run all fastify hooks on the app instance
    for (let hook of cleoConfig?.hooks?.fastifyHooks ?? []) {
      await hook(app, { isDev: true, prerender: false })
    }

    // Render helper is called dynamically
    app.decorateReply('render', null)
    app.decorateReply('renderFragment', null)

    for (let i = 0; i < routeFilePaths.length; i++) {
      let filePath = routeFilePaths[i]
      // Load the route file
      let module = await vite.ssrLoadModule(filePath)
      // Transform the file path to a Fastify route path config
      let path = parseFilePathToRoutePath(filePath, root)
      for (let method of routeMethods) {
        if (module[method]) {
          // TODO: Add dynamic error handler/other functions?
          let dynamicHandler = async function (req: FastifyRequest, res: FastifyReply) {
            const newModule = await vite.ssrLoadModule(filePath)
            let newHandler
            if (typeof newModule[method] === 'function') newHandler = (await newModule[method](app)).handler
            else newHandler = newModule[method].handler
            // const newHandler = newModule[method].handler
            return await newHandler(req, res)
          }

          let resolvedMethod
          if (typeof module[method] === 'function') resolvedMethod = await module[method](app)
          else resolvedMethod = module[method]

          // @ts-ignore
          app[method](path, { ...resolvedMethod, handler: dynamicHandler })
        }
      }
    }

    app.addHook('onRequest', async (req, reply) => {
      let { url } = req.raw

      if (url) {
        let templateHtml = fs.readFileSync(path.resolve(root, './index.html'), 'utf-8')

        let template = await vite.transformIndexHtml(url, templateHtml)
        let { renderRoute, renderComponent } = await vite.ssrLoadModule(path.resolve(__dirname, './lib/view/render.js'))

        // @ts-ignore
        reply.renderFragment = async function (this: FastifyReply, options: RenderRouteOptions) {
          let result = await renderComponent(options, this.request, cleoConfig)
          return this.header('c-fragment', true).html(result)
        }

        // @ts-ignore
        reply.render = async function (this: FastifyReply, options: RenderRouteOptions) {
          let result = await renderRoute(options, req, reply, template, cleoConfig)
          return this.html(result)
        }
      }
      return
    })
  }

  const restartableOpts = {
    runAfterLoad,
    app: appLoader,
    ssrFixStacktrace: vite.ssrFixStacktrace,

    ...(cleoConfig.fastifyOpts ?? {}),
  }

  // @ts-ignore
  let restartable = await start(restartableOpts)

  // Pass requests to the Vite dev server through to the Fastify server
  vite.middlewares.use(async function (req, res, next) {
    await restartable.app.ready()
    return restartable.app.routing(req, res)
  })

  restart = restartable.restart
  listen = restartable.listen
  app = restartable.app

  return { app, vite, listen }
}
