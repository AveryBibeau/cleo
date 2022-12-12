import { FastifyBaseLogger, FastifySchema, RawReplyDefaultExpression, RouteShorthandOptionsWithHandler } from 'fastify'

import { RawRequestDefaultExpression, RawServerDefault } from 'fastify'
import { RouteGenericInterface } from 'fastify'

import { originalGetHref, createRouterConfig, Helmet } from '@ordinal/cleo'

export const createRequestHandler = <S extends FastifySchema>(options: RequestHandler<S>) => options

/* ROUTE_OPTIONS */

export type GetHrefConfig = RouteOptions & {
  query?: Record<string, string>
}

/* ROUTE_CONFIG */

export function getHref(config: GetHrefConfig) {
  return originalGetHref(config, routeConfig)
}

export { Helmet }
