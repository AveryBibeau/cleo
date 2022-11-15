import fs from 'fs'
import path from 'path'
import FastifyStatic, { FastifyStaticOptions } from '@fastify/static'
import { FastifyReply, fastify } from 'fastify'

import { createApp } from './app.js'
import { renderRoute, RenderRouteOptions } from './lib/view/render.js'
import { parseFilePathToRoutePath, routeMethods } from './lib/parseRoutes.js'
import { ServerResponse } from 'http'
import { UserConfig } from 'vite'
import { CleoConfig } from './cleoConfig.js'

export async function createServer(fastifyOpts = {}) {
  const root = process.cwd()
  // Find all the routes
  // Note: Patterns here have to passed as literals (https://vitejs.dev/guide/features.html#glob-import-caveats)
  // Should match patterns found in ./shared.ts
  let routeModules = await import.meta.glob(['/routes/**/*.{ts,tsx,js,jsx}', '!/routes/**/_*.{ts,tsx,js,jsx}'])

  // @ts-ignore
  let viteConfigModule = await import('/vite.config.ts')
  let resolvedViteConfig = (await viteConfigModule.default()) as UserConfig
  let cleoConfig = (resolvedViteConfig.cleoConfig as CleoConfig) ?? {}

  let app = fastify(cleoConfig.fastifyOpts ?? {})

  await createApp(app, {})

  for (const filePath in routeModules) {
    let module = await routeModules[filePath]()
    let path = parseFilePathToRoutePath(filePath, root)

    routeMethods.forEach((method: string) => {
      // @ts-ignore
      if (module[method]) {
        // @ts-ignore
        app[method](path, { ...module[method] })
      }
    })
  }

  const PUBLIC_DIR = path.join(root, '/dist/client')

  // Register static files
  app.register(FastifyStatic, {
    root: PUBLIC_DIR,
    index: false,

    // TODO: Allow passing custom headers for static assets
    setHeaders: (reply: ServerResponse, pathName: string) => {
      const relativePath = pathName.replace(PUBLIC_DIR, '')
      if (relativePath.startsWith('/assets/')) {
        reply.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      } else {
        reply.setHeader('Cache-Control', 'public, max-age=3600')
      }
    },
  } as FastifyStaticOptions)

  // Get the production html template
  let prodTemplate = fs.readFileSync(path.resolve(root + '/dist/client/index.html'), 'utf-8')

  app.decorateReply('render', async function (this: FastifyReply, options: RenderRouteOptions) {
    let result = await renderRoute(options, this.request, this, prodTemplate)
    return this.html(result)
  })

  // TODO: Confirm behavior with vite.resolveHostname - https://github.com/vitejs/vite/blob/0a699856b248116632c1ac18515c0a5c7cf3d1db/packages/vite/src/node/utils.ts#L820-L846
  let resolvedHost = resolvedViteConfig.server?.host ?? 'localhost'
  resolvedHost = resolvedHost === true ? '0.0.0.0' : resolvedHost === false ? 'localhost' : resolvedHost

  return { app, port: resolvedViteConfig.server?.port ?? 5173, host: resolvedHost }
}
