import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import FastifyStatic from '@fastify/static'
import middie from 'middie'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function createServer(root = process.cwd(), isProd = process.env.NODE_ENV === 'production', hmrPort) {
  const resolve = (p) => path.resolve(__dirname, p)
  let app

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite
  if (!isProd) {
    vite = await (
      await import('vite')
    ).createServer({
      root,
      server: {
        middlewareMode: 'ssr',
        hmr: {
          port: hmrPort,
        },
      },
    })
    app = (await vite.ssrLoadModule('./src/app.ts')).createApp(vite)
    await app.register(middie)
    app.use(vite.middlewares)
    app.decorateReply('render', null)
  } else {
    app = (await import('./dist/server/app.js')).createApp(vite)
    app.register(FastifyStatic, {
      root: path.join(__dirname, 'dist/client'),
      index: false,
    })

    let prodTemplate = fs.readFileSync(resolve('dist/client/index.html'), 'utf-8')
    let renderRoute = (await import('./dist/server/app.js')).renderRouteDefault
    app.decorateReply('render', async function (options) {
      let result = await renderRoute(options, this.request, prodTemplate)
      this.html(result)
    })
  }

  app.addHook('onRequest', async (req, reply) => {
    let { url } = req.raw

    if (!isProd) {
      let templateHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8')
      let template = await vite.transformIndexHtml(url, templateHtml)

      let { renderRoute } = await vite.ssrLoadModule('./src/lib/view/render.tsx')

      reply.render = async function (options) {
        let result = await renderRoute(options, req, template)
        this.html(result)
      }
    }
    return
  })

  return { app, vite }
}

createServer().then(({ app }) => {
  app.listen(3000)
})
