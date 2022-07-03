import '##/config'
import { build } from 'esbuild'
import { buildConfig } from '##/build'
import app from '##/app'
import { exec } from 'child_process'
import chalk from 'chalk'

buildConfig.watch = true
buildConfig.plugins?.push({
  name: 'RemoveOldFiles',
  setup(build) {
    build.onStart(() => {
      console.log(chalk.blueBright('[ESBuild] Rebuilding'))
      exec("find ./dist/public -name 'bundle-*' -delete")
    })
    build.onEnd(() => {
      console.log(chalk.greenBright('[ESBuild] Finished rebuilding'))
    })
  },
})
try {
  await build(buildConfig).catch((e) => {
    process.exit(1)
  })

  await app.listen({
    port: 3000,
    host: '0.0.0.0',
  })

  app.log.info('Server listening on port 3000')
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
