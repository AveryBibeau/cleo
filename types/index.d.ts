export { RenderRouteOptions, RenderFragmentOptions } from '../src/lib/view/render'
export { RouteInfo } from '../src/lib/routes'
export { getHref as originalGetHref, createRouterConfig } from '../src/lib/routes'
export { cleo } from '../src/exports/index'

declare module 'fastify' {
  interface FastifyReply {
    html: (content: string) => FastifyReply
    render: <P, L>(options: RenderRouteOptions<P, L>) => FastifyReply
    renderFragment: <P>(options: RenderFragmentOptions<P>) => FastifyReply
    startTime: number
  }
}
