import { FastifyBaseLogger, FastifySchema, RawReplyDefaultExpression, RouteShorthandOptionsWithHandler } from 'fastify'

import { RawRequestDefaultExpression, RawServerDefault } from 'fastify'
import { RouteGenericInterface } from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

export type RequestHandler<S extends FastifySchema = {}> = RouteShorthandOptionsWithHandler<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  RouteGenericInterface,
  unknown,
  S,
  TypeBoxTypeProvider,
  FastifyBaseLogger
>

export function createRequestHandler<S extends FastifySchema>(options: RequestHandler<S>): RequestHandler<S> {
  return options
}
