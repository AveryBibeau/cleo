import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import colors from 'kleur'
import sade from 'sade'
import { build } from 'vite'

import { createDevServer } from './dev.js'

const prog = sade('cleo')

// The project root
const root = process.cwd()

// The library root
const __dirname = path.dirname(fileURLToPath(import.meta.url))

prog.version('0.0.1')

// Move ./includes to project .cleo directory
async function includeCleo() {
  await fs.copy(path.resolve(__dirname, '../src/includes'), path.resolve(root, './.cleo'), { overwrite: true })
}

prog
  .command('dev')
  .describe('Start the Cleo dev server')
  .action(async (opts) => {
    console.log(colors.green('starting dev server...'))

    await includeCleo()
    process.env.NODE_ENV = 'development'

    // @ts-ignore
    createDevServer().then(({ listen }) => {
      console.log('server created')
      listen().then(() => {
        console.log('listening')
      })
    })
  })

prog
  .command('build')
  .describe('Build the production server')
  .action(async (opts) => {
    console.log({ root, __dirname })
    console.log(colors.green('building production server...'))

    await includeCleo()
    process.env.NODE_ENV = 'production'

    process.env.VITE_BUILD = 'client'
    // Client build
    await build({
      configFile: path.resolve(__dirname + '/../vite.config.ts'),
    })

    process.env.VITE_BUILD = 'ssr'
    // Server build
    await build({
      configFile: path.resolve(__dirname + '/../vite.config.ts'),
    })
  })

prog.parse(process.argv)
