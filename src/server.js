import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import FastifyStatic from '@fastify/static'
import middie from '@fastify/middie'
import checker from 'vite-plugin-checker'
import Inspect from 'vite-plugin-inspect'
import { isEqual } from 'lodash-es'
import { start } from './lib/restartable.js'
import { v4 as uuid } from 'uuid'

// The library dir
const __dirname = path.dirname(fileURLToPath(import.meta.url))
import { globby } from 'globby'

import { parseFilePathToRoutePath, routeMethods } from './lib/parseRoutes.js'

const schemaCache = new Map()

export async function createServer(root = process.cwd(), isProd = process.env.NODE_ENV === 'production', hmrPort) {
  const resolve = (p) => path.resolve(__dirname, p)
  let app, stop, restart, listen
  const isServer = process.env.VITE_BUILD === 'ssr'

  console.log({ __dirname, root, isProd })

  // Find all the routes
  let routePaths = await globby(root + '/routes/**/*.{ts,tsx,js,jsx}')

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite
  if (!isProd) {
    vite = await (
      await import('vite')
    ).createServer({
      root,
      appType: 'custom',
      esbuild: {
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
      },
      build: {
        target: 'es2020',
        polyfillModulePreload: false,
        sourcemap: isServer,
        rollupOptions: {
          output: {
            format: 'esm',
          },
        },
      },
      optimizeDeps: {
        include: ['fastify'],
      },
      server: {
        watch: { usePolling: true },
        middlewareMode: true,
        hmr: {
          port: hmrPort,
        },
        commonjsOptions: {
          transformMixedEsModules: true,
        },
      },
      resolve: {
        alias: {
          '##': path.resolve(root, './'),
          '#app': path.resolve(root, './.cleo'),
        },
      },
      plugins: [
        checker({ typescript: true }),
        Inspect(),
        {
          name: 'route-watcher',
          async handleHotUpdate({ file, modules, read }) {
            if (file.startsWith(root + '/routes/')) {
              console.log('route-watcher', file)

              await vite.ssrLoadModule(file).then(async (module) => {
                if (module.get?.schema) {
                  let newSchema = module.get.schema
                  let oldSchema = schemaCache.get(file)
                  console.log('has schema')
                  console.log('new schema', newSchema)
                  console.log('old schema', oldSchema)
                  let schemaHasChanged = !isEqual(newSchema, oldSchema)
                  console.log({ schemaHasChanged })
                  if (schemaHasChanged) {
                    console.warn('RESTARTING FASTIFY SERVER')
                    await restart(restartableOpts)
                    // schemaCache.set(file, newSchema)
                    // Restart the fastify server
                  }
                }
              })
            }
          },
        },
      ],
    })
    console.log('loading app')

    // Create the Fastify app from app.ts
    let appLoader = (await vite.ssrLoadModule(__dirname + '/app.ts')).createApp

    async function runAfterLoad(app) {
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
              let dynamicHandler = async function (req, res) {
                const newModule = await vite.ssrLoadModule(filePath)
                const newHandler = newModule[method].handler
                return await newHandler(req, res)
              }

              app.get(path, { ...module[method], handler: dynamicHandler })

              // Cache the method's schema
              if (module[method].schema) {
                console.log('has initial schema', filePath)
                schemaCache.set(filePath, module[method].schema)
              }
            }
          })
        })
      }

      app.addHook('onRequest', async (req, reply) => {
        let { url } = req.raw

        if (!isProd) {
          let templateHtml = fs.readFileSync(path.resolve(root + '/index.html'), 'utf-8')
          let template = await vite.transformIndexHtml(url, templateHtml)

          let { renderRoute } = await vite.ssrLoadModule(path.resolve(__dirname + '/lib/view/render.tsx'))

          reply.render = async function (options) {
            let result = await renderRoute(options, req, reply, template)
            return this.html(result)
          }
        }
        return
      })
    }

    async function rootAppHook(app) {
      console.log('registering')
      await app.register(middie)
      app.use(vite.middlewares)
      console.log('done registering')
    }

    const restartableOpts = {
      runAfterLoad,
      rootAppHook,
      middlewares: vite.middlewares,
      // vite,
      hostname: '127.0.0.1',
      port: 3000,
      app: appLoader,

      maxParamLength: 1800,
      disableRequestLogging: true,
      ignoreTrailingSlash: true,
      ajv: {
        customOptions: {
          strict: 'log',
          keywords: ['kind', 'modifier'],
        },
      },
      genReqId() {
        return uuid()
      },
      logger: {
        redact: {
          paths: ['headers.authorization'],
          remove: false,
          censor: '[redacted]',
        },
        transport: !isProd
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
      },
    }

    console.log('creating restartable instance')
    let restartable = await start(restartableOpts)
    console.log('done creating restartable instance')

    stop = restartable.stop
    restart = restartable.restart
    listen = restartable.listen
    app = restartable.app

    console.log('app loaded')
  } else {
    app = await (await import('../dist/server/app.js')).createApp(vite)
    const PUBLIC_DIR = path.join(root, 'dist/client')

    // Register static files
    app.register(FastifyStatic, {
      root: PUBLIC_DIR,
      index: false,
      setHeaders: (res, pathName) => {
        const relativePath = pathName.replace(PUBLIC_DIR, '')
        if (relativePath.startsWith('/assets/') || relativePath.startsWith('/fonts/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        } else {
          res.setHeader('Cache-Control', 'public, max-age=3600')
        }
      },
    })

    let prodTemplate = fs.readFileSync(resolve('dist/client/index.html'), 'utf-8')
    let renderRoute = (await import('../dist/server/app.js')).renderRouteDefault
    app.decorateReply('render', async function (options) {
      let result = await renderRoute(options, this.request, this, prodTemplate)
      return this.html(result)
    })
  }

  return { app, vite, listen }
}
