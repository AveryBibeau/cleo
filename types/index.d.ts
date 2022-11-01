export { RenderRouteOptions, RenderFragmentOptions } from '../src/lib/view/render'
export { RouteInfo } from '../src/lib/routes'
export { getHref as originalGetHref, createRouterConfig } from '../src/lib/routes'
export { requestContext } from '@fastify/request-context'
declare module '@fastify/request-context' {
  interface RequestContextData {
    route: {
      url: URL
      params: Record<string, any>
    }
  }
}
