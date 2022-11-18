export { RenderRouteOptions, RenderFragmentOptions } from '../src/lib/view/render'
export { RouteInfo } from '../src/lib/routes'
export { getHref as originalGetHref, createRouterConfig } from '../src/lib/routes'
export { cleo } from '../src/exports/index'
export { defineCleoConfig, CleoConfig, CleoConfigCtx } from '../src/cleoConfig'
export { Helmet } from 'react-helmet'
export { DefaultLayoutProps } from '../src/layouts/default'

declare module 'fastify' {
  interface FastifyReply {
    html: (content: string) => FastifyReply
    render: <P, L>(options: RenderRouteOptions<P, L>) => FastifyReply
    renderFragment: <P>(options: RenderFragmentOptions<P>) => FastifyReply
  }
}
