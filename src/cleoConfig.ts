import { FastifyInstance, FastifyServerOptions } from 'fastify'

type FastifyHook = (app: FastifyInstance, ctx: CleoConfigCtx) => Promise<void> | void

export interface CleoConfig {
  generate?:
    | boolean
    | {
        addPaths?: (() => Promise<string[]>) | string[]
      }
  fastifyOpts?: FastifyServerOptions
  hooks?: {
    fastifyHooks?: FastifyHook[]
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
