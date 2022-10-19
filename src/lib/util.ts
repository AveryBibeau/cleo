import {
  FastifyBaseLogger,
  FastifyInstance,
  FastifyRequest,
  FastifySchema,
  RawReplyDefaultExpression,
  RouteShorthandOptionsWithHandler,
} from 'fastify'

import { RawRequestDefaultExpression, RawServerDefault } from 'fastify'
import { RouteGenericInterface } from 'fastify/types/route'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const rootDir = import.meta.url + '/..'

export const __dirname = dirname(fileURLToPath(rootDir))
export const require = createRequire(rootDir)

export const isDev = process.env.NODE_ENV === 'development'

// export type RequestHandler<S extends FastifySchema = {}> = RouteShorthandOptionsWithHandler<
//   RawServerDefault,
//   RawRequestDefaultExpression<RawServerDefault>,
//   RawReplyDefaultExpression<RawServerDefault>,
//   RouteGenericInterface,
//   unknown,
//   S,
//   TypeBoxTypeProvider,
//   FastifyBaseLogger
// >
// export const createRequestHandler = <S extends FastifySchema>(options: RequestHandler<S>) => options
