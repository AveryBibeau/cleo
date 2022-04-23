import dotenv from 'dotenv'
dotenv.config()

import app from '##/app'

async function main() {
  try {
    await app.listen(3000, () => {
      app.log.info('Server listening on port 3000')
    })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
