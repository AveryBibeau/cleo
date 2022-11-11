import { globby } from 'globby'
import path from 'path'
import fs from 'fs-extra'
import { parseFilePathToRoutePath } from './lib/parseRoutes.js'
import { createServer } from './prodServer.js'
import fetch from 'node-fetch'
import { CleoConfig } from './cleoConfig.js'

// The project root
const root = process.cwd()

export async function generate(cleoConfig: CleoConfig) {
  let app = await createServer()
  await app.listen({
    port: 3000,
    host: '0.0.0.0',
  })

  let routeFilePaths = await globby([
    root + '/routes/**/*.{ts,tsx,js,jsx}',
    '!' + root + '/routes/**/_*.{ts,tsx,js,jsx}',
  ])

  async function generatePath(routePath: string, resultFilePath: string) {
    console.log('Generating route', routePath)
    let res = await fetch(`http://localhost:3000${routePath}`)

    let htmlResponse = await res.text()

    await fs.ensureFile(path.resolve(root, `./dist${resultFilePath}.html`))
    await fs.writeFile(path.resolve(root, `./dist${resultFilePath}.html`), htmlResponse)
  }

  // Generate the routes
  for (let i = 0; i < routeFilePaths.length; i++) {
    let routeFilePath = routeFilePaths[i]
    let routePath = parseFilePathToRoutePath(routeFilePath, root)
    let resultFilePath = parseFilePathToRoutePath(routeFilePath, root, true)
    // TODO: Handle parameter based routes
    if (routePath.includes(':')) {
    } else {
      await generatePath(routePath, resultFilePath)
    }
  }

  // Generate additional routes
  if (typeof cleoConfig?.generate === 'object') {
    let addPathsOpts = cleoConfig.generate.addPaths
    let additionalPaths: string[] = []
    if (typeof addPathsOpts === 'function') {
      additionalPaths = await addPathsOpts()
    } else if (Array.isArray(addPathsOpts)) {
      additionalPaths = addPathsOpts
    }

    for (let routePath of additionalPaths) {
      let resultFilePath = routePath
      if (resultFilePath.endsWith('/')) resultFilePath = resultFilePath.slice(0, -1)
      if (!resultFilePath.startsWith('/')) resultFilePath = '/' + resultFilePath

      await generatePath(routePath, resultFilePath)
    }
  }

  // Shutdown the server
  await app.close()

  // Rm the server code
  await fs.remove(path.resolve(root, `./dist/server/`))

  // Rm the index.html template
  await fs.remove(path.resolve(root, `./dist/client/index.html`))

  // Move everything in /client up a level
  await fs.copy(path.resolve(root, `./dist/client/`), path.resolve(root, `./dist/`), { overwrite: true })

  // Remove the /client dir
  await fs.remove(path.resolve(root, `./dist/client/`))
}
