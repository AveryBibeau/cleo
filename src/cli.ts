import path from 'path'
import fs from 'fs-extra'
import { fileURLToPath } from 'url'
import colors from 'kleur'
import sade from 'sade'
import { build } from 'vite'

import { createDevServer } from './dev.js'
import { createRouteIncludes } from './lib/parseRoutes.js'
import { globby } from 'globby'
import { includeCleo } from './lib/includes.js'
// import { generate } from './generate.js'
const prog = sade('cleo')

// The project root
const root = process.cwd()

// The library root
const __dirname = path.dirname(fileURLToPath(import.meta.url))

prog.version('0.0.1')

prog
  .command('dev')
  .describe('Start the Cleo dev server')
  .action(async (opts) => {
    console.log(colors.green('starting dev server...'))

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
    let routeFilePaths = await globby([
      root + '/routes/**/*.{ts,tsx,js,jsx}',
      '!' + root + '/routes/**/_*.{ts,tsx,js,jsx}',
    ])
    let { routeOptionsString, routeDefinitionsString } = createRouteIncludes(routeFilePaths, root)
    await includeCleo({ routeDefinitions: routeDefinitionsString, routeOptions: routeOptionsString })

    // Clear the old dist folder
    await fs.emptyDir(path.resolve(root + '/dist/'))

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

prog
  .command('generate')
  .describe('Statically generates the routes')
  .action(async (opts) => {
    console.log({ root, __dirname })
    console.log(colors.green('building production server...'))
    let routeFilePaths = await globby([
      root + '/routes/**/*.{ts,tsx,js,jsx}',
      '!' + root + '/routes/**/_*.{ts,tsx,js,jsx}',
    ])
    let { routeOptionsString, routeDefinitionsString } = createRouteIncludes(routeFilePaths, root)
    await includeCleo({ routeDefinitions: routeDefinitionsString, routeOptions: routeOptionsString })

    // Clear the old dist folder
    await fs.emptyDir(path.resolve(root + '/dist/'))

    process.env.NODE_ENV = 'production'

    process.env.VITE_BUILD = 'client'
    // Client build
    await build({
      configFile: path.resolve(__dirname + '/../vite.config.ts'),
    })

    process.env.VITE_BUILD = 'ssr'
    process.env.VITE_GENERATE = 'true'
    // Server build
    await build({
      configFile: path.resolve(__dirname + '/../vite.config.ts'),
    })

    console.log('starting production server...')

    let generateModule = await import(path.resolve(root + '/dist/server/generate.js'))
    let { generate } = generateModule
    // console.log({ generateModule })
    await generate()
  })

prog.parse(process.argv)
