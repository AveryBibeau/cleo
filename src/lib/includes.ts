import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

// TODO: Move to shared
// The project root
const root = process.cwd()

// The library root
// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface IncludeCleoOpts {
  routeOptions: string
  routeDefinitions: string
}

export async function includeCleo(opts: IncludeCleoOpts) {
  // Move ./includes to project .cleo directory
  await fs.copy(path.resolve(__dirname, '../../src/includes'), path.resolve(root, './.cleo'), { overwrite: true })

  // Read the index file
  let indexFileData = await fs.readFile(path.resolve(root, './.cleo/index.ts'))
  let fileContents = indexFileData.toString()

  let rewrittenContents = fileContents
    .replace('/* ROUTE_OPTIONS */', opts.routeOptions)
    .replace('/* ROUTE_CONFIG */', opts.routeDefinitions)

  await fs.writeFile(path.resolve(root, './.cleo/index.ts'), rewrittenContents)
}
