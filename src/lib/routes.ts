import { pathToRegexp, compile, Key, PathFunction } from 'path-to-regexp'

export interface RouteInfo {
  name: string
  path: string
  matcher?: RegExp
  keys?: Key[]
  compiler?: PathFunction<object>
}

export type RouteParamsRecord = Record<string, string | number>
export type RouteQueryRecord = Record<string, string>

export interface GetHrefConfig {
  name: string
  params?: RouteParamsRecord
  query?: RouteQueryRecord
}

export function getHref(config: GetHrefConfig, routeConfig: RouteInfo[]): string {
  let href = ''
  // Get corresponding route definition
  const routeDef = routeConfig.find((route) => route.name === config.name)
  if (!routeDef) throw new Error(`Route definition with name ${config.name} not found`)
  // Check if the route definition is a dynamic route
  if (routeDef.matcher && routeDef.compiler) {
    // Try generating the path definition with the config's params
    const dynamicPath = routeDef.compiler(config.params ?? {})
    // TODO: Test for missing params, incorrect params, etc.
    href += dynamicPath
  } else {
    href += routeDef.path
  }

  let mergedQuery: RouteQueryRecord = {}
  if (config.query) {
    // Don't include the existing query if a route name or query is provided
    mergedQuery = config.query
  }

  // Delete any undefined properties
  Object.keys(mergedQuery).forEach((key) => mergedQuery[key] === undefined && delete mergedQuery[key])

  const currentQuery = new URLSearchParams(mergedQuery)
  const qs = currentQuery.toString()
  if (qs) href += `?${qs}`

  return href
}

export function createRouterConfig(routes: Pick<RouteInfo, 'name' | 'path'>[]): RouteInfo[] {
  return routes.map((route) => {
    if (route.path.includes('/:')) {
      let keys: Key[] = []
      let matcher = pathToRegexp(route.path, keys)
      return {
        ...route,
        matcher,
        compiler: compile(route.path, { encode: encodeURIComponent }),
        keys,
      }
    } else return route
  })
}

export function urlParamsToObject(params: URLSearchParams) {
  const result: Record<string, string> = {}
  params.forEach((val, key) => {
    result[key] = val
  })
  return result
}
