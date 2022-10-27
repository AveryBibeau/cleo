import { FastifyBaseLogger, FastifySchema, RawReplyDefaultExpression, RouteShorthandOptionsWithHandler } from 'fastify'

import { RawRequestDefaultExpression, RawServerDefault } from 'fastify'
import { RouteGenericInterface } from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

import { originalGetHref, createRouterConfig } from 'cleo'

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

export const createRequestHandler = <S extends FastifySchema>(options: RequestHandler<S>) => options

/* ROUTE_OPTIONS */

export type GetHrefConfig = RouteOptions & {
  query?: Record<string, string>
}

/* ROUTE_CONFIG */

export function getHref(config: GetHrefConfig) {
  return originalGetHref(config, routeConfig)
}
