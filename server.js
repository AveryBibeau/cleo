const { createServer: createViteServer } = require('vite')
const fs = require('fs')
const path = require('path')
const middie = require('middie')
const FastifyStatic = require('@fastify/static')

const isDev = process.env.NODE_ENV === 'development'

async function main() {
  const vite = await createViteServer({
    server: { middlewareMode: 'ssr' },
  })

  let app
  if (isDev) app = (await vite.ssrLoadModule('./src/app.ts')).default.app
  else app = require('./dist/server/app.js').default.app

  if (isDev) {
    await app.register(middie)
    app.use(vite.middlewares)
    app.decorateReply('render', null)
  }

  if (!isDev) {
    app.register(FastifyStatic, {
      root: path.join(__dirname, 'dist/client'),
      index: false,
    })

    let prodTemplate = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
    let renderRoute = require('./dist/server/app.js').default.renderRoute
    app.decorateReply('render', async function (options) {
      let result = await renderRoute(options, this.request, prodTemplate)
      this.html(result)
    })
  }

  app.addHook('onRequest', async (req, reply) => {
    let { url } = req.raw

    if (isDev) {
      let templateHtml = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
      let template = await vite.transformIndexHtml(url, templateHtml)

      let { renderRoute } = await vite.ssrLoadModule('./src/lib/view/render.tsx')

      reply.render = async function (options) {
        let result = await renderRoute(options, req, template)
        this.html(result)
      }
    }
    return
  })

  await app.listen(3000, () => {
    app.log.info('Server listening on port 3000')
  })
}

main()
