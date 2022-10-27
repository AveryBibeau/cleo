import fs from 'fs'
import path from 'path'
import FastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import { pathToRegexp, compile, Key, PathFunction } from 'path-to-regexp'

// @ts-ignore
import { fastifyOpts } from './shared.js'

import { createApp } from './app'

import { renderRoute } from './lib/view/render'

// @ts-ignore
import { parseFilePathToRoutePath, routeMethods } from './lib/parseRoutes.js'

export async function createServer() {
  const root = process.cwd()
  // Find all the routes
  let routeModules = await import.meta.glob(['/routes/**/*.{ts,tsx,js,jsx}', '!/routes/**/_*.{ts,tsx,js,jsx}'])

  // @ts-ignore
  let app = Fastify(fastifyOpts)
  // @ts-ignore
  await createApp(app, {})

  for (const filePath in routeModules) {
    let module = await routeModules[filePath]()
    let path = parseFilePathToRoutePath(filePath, root)

    if (path.includes('/:')) {
      let keys: Key[] = []
      let matcher = pathToRegexp(path, keys)
      console.log({ path, keys })
    }

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
    setHeaders: (res, pathName) => {
      const relativePath = pathName.replace(PUBLIC_DIR, '')
      if (relativePath.startsWith('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600')
      }
    },
  })

  // Get the production html template
  let prodTemplate = fs.readFileSync(path.resolve(root + '/dist/client/index.html'), 'utf-8')

  // @ts-ignore
  app.decorateReply('render', async function (options) {
    // @ts-ignore
    let result = await renderRoute(options, this.request, this, prodTemplate)
    // @ts-ignore
    return this.html(result)
  })

  return app
}
