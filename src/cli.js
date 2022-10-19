import fs from 'fs'
import path from 'path'
import colors from 'kleur'
import sade from 'sade'

import { createServer } from './server.js'

const prog = sade('cleo')

prog.version('0.0.1')

prog
  .command('dev')
  .describe('Start the Cleo dev server')
  .action(async (opts) => {
    console.log(colors.green('starting dev server...'))
    process.env.NODE_ENV = 'development'

    createServer().then(({ listen }) => {
      console.log('server created')
      listen().then(() => {
        console.log('listening')
      })
    })
  })

prog.parse(process.argv)
