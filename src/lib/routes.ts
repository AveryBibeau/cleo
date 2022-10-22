import { pathToRegexp, compile, Key, PathFunction } from 'path-to-regexp'

export interface RouteInfo {
  name: string
  path: string
  matcher?: RegExp
  keys?: Key[]
  compiler?: PathFunction<object>
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
