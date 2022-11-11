export { RenderRouteOptions, RenderFragmentOptions } from '../src/lib/view/render'
export { RouteInfo } from '../src/lib/routes'
export { getHref as originalGetHref, createRouterConfig } from '../src/lib/routes'
export { cleo } from '../src/exports/index'
export { defineCleoConfig, CleoConfig } from '../src/cleoConfig'

declare module 'fastify' {
  interface FastifyReply {
    html: (content: string) => FastifyReply
    render: <P, L>(options: RenderRouteOptions<P, L>) => FastifyReply
    renderFragment: <P>(options: RenderFragmentOptions<P>) => FastifyReply
    startTime: number
  }
}
declare module 'vite' {
  interface UserConfig {
    cleoConfig?: CleoConfig
  }
}
