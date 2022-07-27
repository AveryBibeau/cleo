import { RegisterOptions } from 'fastify'
import { RouteOptions, extendRoutes } from '##/lib/routeUtils'
import { AppInstance } from '##/app'
import { isDev } from '##/lib/util'

const HomeGetImport = async () => (await import('##/routes/example')).HomeGet

export const routes = [
  {
    name: 'Home',
    path: '/',
    method: 'GET',
    resolver: HomeGetImport,
  },
] as const

let constRoutes = routes as unknown as readonly RouteOptions[]

export type RouteName = typeof routes[number]['name']

export const routerPlugin = async (app: AppInstance, options: RegisterOptions) => {
  // Cache dynamic route matchers
  extendRoutes(constRoutes)

  for (const route of constRoutes) {
    // Load all of the route's config
    let resolverSettings = (await route.resolver())(app)

    /**
     * In dev, use a dynamic resolver that calls the import for the route's handler on every request.
     *
     */
    if (isDev) {
      // Resolve module every time in dev
      let dynamicResolver = async function (req: any, reply: any) {
        let resolverImport = (await route.resolver())(app)
        let { handler } = resolverImport

        return await handler(req, reply)
      }
      resolverSettings.handler = dynamicResolver
    }

    app.route({
      url: route.path,
      method: route.method,
      ...resolverSettings,
    })
  }
}
