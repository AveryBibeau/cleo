import { createServer } from './prodServer.js'

createServer().then(async ({ app, port, host }) => {
  // TODO: Add customizeable port/host
  await app.listen({
    port,
    host,
  })

  console.info(`Server listening on ${host}:${port}`)
})
