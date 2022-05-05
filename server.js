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
  let template
  if (!isDev) template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')

  async function getTemplate(url) {
    if (isDev) {
      let templateHtml = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
      template = await vite.transformIndexHtml(url, templateHtml)
    }
    return template
  }

  let app
  if (process.env.NODE_ENV === 'development') app = (await vite.ssrLoadModule('./src/app.tsx')).makeServer(getTemplate)
  else app = require('./dist/server/app.js').makeServer(getTemplate)

  if (process.env.NODE_ENV === 'development') {
    await app.register(middie)
    app.use(vite.middlewares)
  }

  if (!isDev)
    app.register(FastifyStatic, {
      root: path.join(__dirname, 'dist/client'),
      index: false
    })

  await app.listen(3000, () => {
    app.log.info('Server listening on port 3000')
  })
}

main()
