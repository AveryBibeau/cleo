import { createServer } from './prodServer.js'

createServer().then((app) => {
  app.listen({
    port: 3000,
    host: '0.0.0.0',
  })
})
