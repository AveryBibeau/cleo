import '##/config'
import app from '##/app'

try {
  await app.listen({
    port: 3000,
    host: '0.0.0.0',
  })

  app.log.info('Server listening on port 3000')
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
