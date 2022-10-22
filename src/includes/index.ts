// import { FastifyBaseLogger, FastifySchema, RawReplyDefaultExpression, RouteShorthandOptionsWithHandler } from 'fastify'

// import { RawRequestDefaultExpression, RawServerDefault } from 'fastify'
// import { RouteGenericInterface } from 'fastify'
// import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

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

// export type RouteParamsRecord = Record<string, string | number>
// export type RouteQueryRecord = Record<string, string>

// export interface GetHrefConfig {
//   name: string
//   params?: RouteParamsRecord
//   query?: RouteQueryRecord
// }

// export function getHref(config: GetHrefConfig): string {
//   let href = ''
//   // Get corresponding route definition
//   const routeDef = extendedRoutes.find((route) => route.name === config.name)
//   if (!routeDef) throw new Error(`Route definition with name ${config.name} not found`)
//   // Check if the route definition is a dynamic route
//   if (routeDef.matcher && routeDef.compiler) {
//     // Try generating the path definition with the config's params
//     const dynamicPath = routeDef.compiler(config.params ?? {})
//     // TODO: Test for missing params, incorrect params, etc.
//     href += dynamicPath
//   } else {
//     href += routeDef.path
//   }

//   let mergedQuery: RouteQueryRecord = {}
//   if (config.query) {
//     // Don't include the existing query if a route name or query is provided
//     mergedQuery = config.query
//   }

//   // Delete any undefined properties
//   Object.keys(mergedQuery).forEach((key) => mergedQuery[key] === undefined && delete mergedQuery[key])

//   const currentQuery = new URLSearchParams(mergedQuery)
//   const qs = currentQuery.toString()
//   if (qs) href += `?${qs}`

//   return href
// }
