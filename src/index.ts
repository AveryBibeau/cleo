import dotenv from 'dotenv'
dotenv.config()

import app from '##/app'

try {
  await app.listen(3000, () => {
    app.log.info('Server listening on port 3000')
  })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
