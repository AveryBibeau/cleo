import { FastifyServerOptions } from 'fastify'

export interface CleoConfig {
  generate?:
    | boolean
    | {
        addPaths?: (() => Promise<string[]>) | string[]
      }
  fastifyOpts?: FastifyServerOptions
}
