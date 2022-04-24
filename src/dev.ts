import dotenv from 'dotenv'
dotenv.config()
import { build } from 'esbuild'
import { buildConfig } from '##/build'
import app from '##/app'
import { exec } from 'child_process'

buildConfig.watch = true
buildConfig.plugins?.push({
  name: 'RemoveOldFiles',
  setup(build) {
    build.onStart(() => {
      exec("find ./dist/public -name 'bundle-*' -delete")
    })
  },
})
try {
  await build(buildConfig).catch((e) => {
    process.exit(1)
  })

  await app.listen(3000, () => {
    app.log.info('Server listening on port 3000')
  })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
