import { RegisterOptions } from 'fastify'
import { RouteOptions, extendRoutes } from '##/lib/routeUtils'
import { HomeGet } from '##/routes/example'
import { AppInstance } from '##/app'

export const routes = [
  {
    name: 'Home',
    path: '/',
    method: 'GET',
    resolver: HomeGet,
  },
] as const

let constRoutes = routes as unknown as readonly RouteOptions[]

export type RouteName = typeof routes[number]['name']

export const routerPlugin = async (app: AppInstance, options: RegisterOptions) => {
  // Cache dynamic route matchers
  extendRoutes(constRoutes)
  constRoutes.forEach((route) => {
    app.route({
      url: route.path,
      method: route.method,
      ...route.resolver(app),
    })
  })
}
