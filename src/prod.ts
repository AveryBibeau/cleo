import { createServer } from './prodServer.js'

createServer().then((app) => {
  // TODO: Add customizeable port/host
  app.listen({
    port: 3000,
    host: '0.0.0.0',
  })
})
