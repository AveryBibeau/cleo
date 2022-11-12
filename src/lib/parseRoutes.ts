import { inspect } from 'util'
import { createRouterConfig } from './routes.js'

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

export function createRouteIncludes(routeFilePaths: string[], root: string) {
  let routePaths = routeFilePaths.map((filePath) => parseFilePathToRoutePath(filePath, root))
  let routeDefinitions = routePaths.map((path) => ({
    name: parseRoutePathToName(path),
    path,
  }))

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
    `.replace("'any'", 'any')

  let routeDefinitionsString = `
    const routeConfig = createRouterConfig(${inspect(routeDefinitions)})
    `

  return { routeOptionsString, routeDefinitionsString }
}
