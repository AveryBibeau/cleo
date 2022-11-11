import { RenderRouteOptions, RenderFragmentOptions, CleoConfig } from '@ordinal/cleo'

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
    cleoConfig: CleoConfig
  }
}
