import Fastify, { FastifyInstance, FastifyReply } from 'fastify'

import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

import { renderRoute, renderComponent, RenderRouteOptions, RenderFragmentOptions } from './lib/view/render'
// import { ErrorLayout } from '##/layouts/error'

import { __dirname, isDev } from './lib/util'
// import { routerPlugin } from '##/router'
// import { Session as SessionType } from './lib/view/context'
import { h } from 'preact'
import middie from '@fastify/middie'

declare module 'fastify' {
  // export interface Session extends SessionType {}
  interface FastifyReply {
    html: (content: string) => FastifyReply
    render: <P, L>(options: RenderRouteOptions<P, L>) => FastifyReply
    renderFragment: <P>(options: RenderFragmentOptions<P>) => FastifyReply
    startTime: number
  }
  // interface FastifyLoggerOptions {
  //   redact?:
  //     | string[]
  //     | {
  //         paths: string[]
  //         remove: boolean
  //         censor: string
  //       }
  // }
}

export async function createApp(app: FastifyInstance, opts: any) {
  // console.log('registering', opts.middlewares)
  // await app.register(middie)
  // // app.use(opts.middlewares)
  // console.log('done registering')
  // console.log(app.printPlugins())
  // console.log(app)

  // const app = Fastify({
  //   maxParamLength: 1800,
  //   disableRequestLogging: true,
  //   ignoreTrailingSlash: true,
  //   ajv: {
  //     customOptions: {
  //       strict: 'log',
  //       keywords: ['kind', 'modifier'],
  //     },
  //   },
  //   genReqId() {
  //     return uuid()
  //   },
  //   logger: {
  //     redact: {
  //       paths: ['headers.authorization'],
  //       remove: false,
  //       censor: '[redacted]',
  //     },
  //     transport: isDev
  //       ? {
  //           target: 'pino-pretty',
  //           options: {
  //             translateTime: 'HH:MM:ss Z',
  //             ignore: 'pid,hostname',
  //           },
  //         }
  //       : undefined,
  //   },
  // }).withTypeProvider<TypeBoxTypeProvider>()

  /**
   * Add custom logging to filter logs for static resources in dev (/public/ shouldn't be served the app
   * in production)
   */
  app.addHook('onRequest', (req, reply, done) => {
    // Ignore requests without a registered route (static files)
    if (!req.routerPath) return done()
    reply.startTime = performance.now()
    req.log.info({ url: req.raw.url, method: req.method }, '[Request]')
    done()
  })
  app.addHook('onResponse', (req, reply, done) => {
    // Ignore requests without a registered route (static files)
    if (!req.routerPath) return done()
    req.log.info(
      {
        url: req.raw.url,
        statusCode: reply.raw.statusCode,
        durationMs: performance.now() - reply.startTime,
      },
      '[Reply]'
    )
    done()
  })

  app.decorateReply('html', function (this: FastifyReply, content: string) {
    return this.type('text/html; charset=utf-8').send(content)
  })

  app.decorateReply('renderFragment', async function <
    P extends h.JSX.IntrinsicAttributes
  >(this: FastifyReply, options: RenderFragmentOptions<P>) {
    let result = await renderComponent<P>(options, this.request)
    return this.html(result)
  })

  // Custom error handler for rendering error layout
  app.setErrorHandler(async function (error, request, reply) {
    isDev && opts.vite.ssrFixStacktrace(error)
    // Log error
    this.log.error(error)
    /**
     * Try sending error response, fallback catch for errors thrown in renderRoute
     */
    try {
      // TODO: Load error layout or use fallback
      // await reply.status(error.statusCode ?? 500).render({
      //   component: ErrorLayout,
      //   head: errorHead,
      //   props: { error },
      // })
    } catch (e) {
      this.log.error(error)
      let errorMessage = 'There was an error processing your request. Please try again later.'
      if (isDev && error.stack) errorMessage += '\n\n' + error.stack
      return reply.status(500).send(errorMessage)
    }
  })

  app.get('/healthz', function (req, res) {
    return res.status(200).send()
  })

  await opts.runAfterLoad(app)
}
export const renderRouteDefault = renderRoute

export type AppInstance = ReturnType<typeof createApp>
