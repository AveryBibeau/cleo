import { FastifyInstance, FastifyReply, FastifyRequest, FastifyServerOptions } from 'fastify'
import { SharedRenderRouteOptions } from './lib/view/render.js'

type FastifyHook = (app: FastifyInstance, ctx: CleoConfigCtx) => Promise<void> | void

type RenderPageHook = (
  request: FastifyRequest,
  reply: FastifyReply,
  renderOpts: SharedRenderRouteOptions
) => Promise<void> | void

export interface CleoConfig {
  generate?:
    | boolean
    | {
        addPaths?: (() => Promise<string[]>) | string[]
      }
  fastifyOpts?: FastifyServerOptions
  hooks?: {
    fastifyHooks?: FastifyHook[]
    beforeRenderPage?: RenderPageHook[]
  }
}

export interface CleoConfigCtx {
  isDev: boolean
  prerender: boolean
}

export type DefineCleoConfigResolver = CleoConfig | ((opts: CleoConfigCtx) => CleoConfig | Promise<CleoConfig>)

export function defineCleoConfig(options: DefineCleoConfigResolver) {
  return options
}
