import { FastifyInstance, RegisterOptions } from 'fastify'
import { RouteOptions } from '##/lib/routeUtils'
import { SampleHandler } from '##/routes/example'

export const routes: RouteOptions[] = [
  {
    path: '/',
    name: 'home',
    method: 'GET',
    resolver: SampleHandler,
  },
]

export const routerPlugin = async (app: FastifyInstance, options: RegisterOptions) => {
  routes.forEach((route) => {
    if (typeof route.resolver === 'object')
      app.route({
        url: route.path,
        method: route.method,
        ...route.resolver,
      })
    else if (typeof route.resolver === 'function')
      app.route({
        url: route.path,
        method: route.method,
        ...route.resolver(app),
      })
  })
}
