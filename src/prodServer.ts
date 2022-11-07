import fs from 'fs'
import path from 'path'
import FastifyStatic, { FastifyStaticOptions } from '@fastify/static'
import { FastifyReply, fastify } from 'fastify'

import { fastifyOpts } from './shared.js'
import { createApp } from './app.js'
import { renderRoute, RenderRouteOptions } from './lib/view/render.js'
import { parseFilePathToRoutePath, routeMethods } from './lib/parseRoutes.js'
import { ServerResponse } from 'http'

export async function createServer() {
  const root = process.cwd()
  // Find all the routes
  let routeModules = await import.meta.glob(['/routes/**/*.{ts,tsx,js,jsx}', '!/routes/**/_*.{ts,tsx,js,jsx}'])

  let app = fastify(fastifyOpts)

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

  return app
}
