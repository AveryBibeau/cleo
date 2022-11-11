import fs from 'fs-extra'
import path from 'path'
import { root, __dirname } from '../shared.js'

interface IncludeCleoOpts {
  routeOptions: string
  routeDefinitions: string
}

// Move ./includes to project .cleo directory
export async function includeCleo(opts: IncludeCleoOpts) {
  await fs.ensureDir(path.resolve(root, './.cleo/@types/'))

  await fs.copy(
    path.resolve(__dirname, '../src/includes/@types/index.d.ts'),
    path.resolve(root, './.cleo/@types/index.d.ts'),
    { overwrite: true }
  )

  // Read the index file
  let indexFileData = await fs.readFile(path.resolve(__dirname, '../src/includes/index.ts'))
  let fileContents = indexFileData.toString()

  let rewrittenContents = fileContents
    .replace('/* ROUTE_OPTIONS */', opts.routeOptions)
    .replace('/* ROUTE_CONFIG */', opts.routeDefinitions)

  await fs.writeFile(path.resolve(root, './.cleo/index.ts'), rewrittenContents)
}
