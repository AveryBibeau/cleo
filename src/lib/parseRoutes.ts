export const routeMethods = ['delete', 'get', 'head', 'patch', 'post', 'put', 'options']

export function parseFilePathToRoutePath(path: string, dir: string): string {
  let filePath = path.replace(dir, '').replace('/routes', '')

  const squareBracketRegex = /\[(.*)\]/gu
  const extensionRegex = /\.[jt]s[x]?$/u
  const wildCardRouteRegex = /\[\.\.\..+\]/gu
  const multipleParamRegex = /\]-\[/gu
  const routeParamRegex = /\]\/\[/gu

  // Clean file extensions like .tsx
  const withoutExtension = filePath.replace(extensionRegex, '')

  // Replace spread params like [...slug] with wildcard *
  const withWildcards = withoutExtension.replace(wildCardRouteRegex, '*')

  // Replace basic params like [slug] with :slug
  const withRouteParams = withWildcards.replace(squareBracketRegex, (subString, match) => `:${String(match)}`)

  // Replace multiple params like [slug]-[id] with :slug-:id
  const withMultiParams = withRouteParams.replace(multipleParamRegex, '-:').replace(routeParamRegex, '/:')

  // Replace /index to squash index routes
  const withoutIndex = withMultiParams.replace('/index', '')

  // In the case that withoutIndex is an empty string, it should just be / (the root route)
  if (withoutIndex === '') return '/'

  return withoutIndex
}

export function parseRoutePathToName(path: string): string {
  // Remove the first slash and param
  if (path.startsWith('/')) path = path.slice(1)
  if (path.startsWith(':')) path = path.slice(1)

  if (path === '') return 'index'

  path.replace('/:', '-')
  path.replace('/', '-')

  return path
}
