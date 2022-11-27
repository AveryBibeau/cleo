#!/usr/bin/env node

import fs from 'fs-extra'
import path from 'path'
import sade from 'sade'
import kleur from 'kleur'
import { fileURLToPath } from 'url'

sade('create-cleo <dir>', true)
  .version('0.0.1')
  .describe('Creates a starter template for an @ordinal/cleo project')
  .action((dir: string) => {
    if (!dir.startsWith('.') && !dir.startsWith('/')) {
      dir = './' + dir
    }

    const resolvedTargetDir = path.resolve(dir)

    const templatePath = fileURLToPath(new URL(`../template`, import.meta.url).href)

    if (fs.existsSync(resolvedTargetDir)) {
      console.error(kleur.red().bold(`Directory ${dir} already exists. Please specify a non-existent directory.`))

      return
    }

    console.log(kleur.blue().bold(`Creating @ordinal/cleo template in directory ${resolvedTargetDir}`))
    fs.copySync(templatePath, resolvedTargetDir, {
      overwrite: false,
    })

    // Rewrite _gitignore => .gitignore
    fs.renameSync(path.resolve(dir, './_gitignore'), path.resolve(dir, './.gitignore'))
  })
  .parse(process.argv)
