import { inspect } from 'util'
import { createRouterConfig } from './routes.js'
import fs from 'fs-extra'

export const routeMethods = ['delete', 'get', 'head', 'patch', 'post', 'put', 'options']

export function parseFilePathToRoutePath(path: string, dir: string, keepIndex: boolean = false): string {
  let filePath = path.replace(dir, '').replace('/routes', '')

  const squareBracketRegex = /\[(.*)\]/gu
  const extensionRegex = /\.[jt]s[x]?$/u
  const wildCardRouteRegex = /\[\.\.\..+\]/gu
  const multipleParamRegex = /\]-\[/gu
  const routeParamRegex = /\]\/\[/gu
  const parensIndexRegex = /\/\((.*)\)/gu

  // Clean file extensions like .tsx
  const withoutExtension = filePath.replace(extensionRegex, '')

  // Replace spread params like [...slug] with wildcard *
  const withWildcards = withoutExtension.replace(wildCardRouteRegex, '*')

  // Replace basic params like [slug] with :slug
  const withRouteParams = withWildcards.replace(squareBracketRegex, (subString, match) => `:${String(match)}`)

  // Replace multiple params like [slug]-[id] with :slug-:id
  const withMultiParams = withRouteParams.replace(multipleParamRegex, '-:').replace(routeParamRegex, '/:')

  if (keepIndex) return withMultiParams

  // Replace /index to squash index routes
  const withoutIndex = withMultiParams.replace('/index', '')

  // Squash parenthetical index routes, i.e. /posts/(posts).tsx => /posts
  const withoutParens = withoutIndex.replace(parensIndexRegex, '')

  // In the case that withoutIndex is an empty string, it should just be / (the root route)
  if (withoutParens === '') return '/'

  return withoutParens
}

export function parseRoutePathToName(path: string): string {
  // Remove the first slash and param
  if (path.startsWith('/')) path = path.slice(1)
  if (path.startsWith(':')) path = path.slice(1)

  if (path === '') return 'index'

  path = path.replace('/:', '-')
  path = path.replace('/', '-')

  return path
}

/**
 * Matches exported route names in route module files. The name cannot be extracted from
 * an imported module since this happens during the Vite plugin (buildStart) lifecycle.
 */
// TODO: Validate valid syntax, e.g. white space
// NOTE: Not matching ` characters since the module isn't evaluated
const routeNameMatcher = /export (?:const|let) name\s*=\s*(?:'|")(.*)(?:'|")/

export async function createRouteIncludes(routeFilePaths: string[], root: string) {
  let routeDefinitions: { name: string; path: string }[] = []
  for (let filePath of routeFilePaths) {
    const routePath = parseFilePathToRoutePath(filePath, root)

    const routeModule = await (await fs.readFile(filePath)).toString()

    let routeNameMatch = routeNameMatcher.exec(routeModule)
    let routeName = parseRoutePathToName(routePath)
    if (routeNameMatch?.[1]) routeName = routeNameMatch[1]

    routeDefinitions.push({
      name: routeName,
      path: routePath,
    })
  }

  let routeConfig = createRouterConfig(routeDefinitions)

  let routeOptions = routeConfig.map((config) => {
    let options: Record<any, any> = {
      name: config.name,
    }
    if (config.keys) {
      let params: Record<any, any> = {}
      config.keys.forEach((key) => (params[key.name] = 'any'))
      options.params = params
    }
    return options
  })

  let routeOptionsString = `
    type RouteOptions =
      |
        ${routeOptions.map((option) => inspect(option)).join(' | ')}
    `.replace(/'any'/g, 'any')

  let routeDefinitionsString = `
    export const routeConfig = createRouterConfig(${inspect(routeDefinitions)})
    `

  return { routeOptionsString, routeDefinitionsString }
}
