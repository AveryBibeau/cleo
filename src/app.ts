import Fastify, { FastifyReply } from 'fastify'
import FastifySensible from '@fastify/sensible'
import FastifyCookie from '@fastify/cookie'
import FastifySession from '@fastify/session'
import type { ViteDevServer } from 'vite'

import { RenderRouteOptions, RenderFragmentOptions, renderComponent, renderRoute } from '##/lib/view/render'
import { ErrorLayout } from '##/layouts/error'
import { routerPlugin } from '##/router'
import { __dirname, isDev } from '##/lib/util'
import { Session as SessionType } from '##/lib/context'
import { v4 as uuid } from 'uuid'

declare module 'fastify' {
  export interface Session extends SessionType {}
  interface FastifyReply {
    html: (content: string) => FastifyReply
    render: <P, L>(options: RenderRouteOptions<P, L>) => FastifyReply
    renderFragment: <P>(options: RenderFragmentOptions<P>) => FastifyReply
    startTime: number
  }
  interface FastifyLoggerOptions {
    redact?:
      | string[]
      | {
          paths: string[]
          remove: boolean
          censor: string
        }
  }
}

export function createApp(vite: ViteDevServer) {
  const app = Fastify({
    maxParamLength: 1800,
    disableRequestLogging: true,
    ignoreTrailingSlash: true,
    genReqId() {
      return uuid()
    },
    logger: {
      redact: {
        paths: ['headers.authorization'],
        remove: false,
        censor: '[redacted]',
      },
      prettyPrint:
        process.env.NODE_ENV === 'development'
          ? {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            }
          : false,
    },
  })

  /**
   * Add custom logging to filter logs for static resources in dev (/public/ shouldn't be served the app
   * in production)
   */
  app.addHook('onRequest', (req, reply, done) => {
    if (isDev && (req.raw.url?.includes('/src/') || req.raw.url?.includes('vite'))) return done()
    reply.startTime = performance.now()
    req.log.info({ url: req.raw.url, method: req.method }, '[Request]')
    done()
  })

  app.addHook('onResponse', (req, reply, done) => {
    if (isDev && (req.raw.url?.includes('/src/') || req.raw.url?.includes('vite'))) return done()
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
  app.register(FastifySensible, {
    errorHandler: false,
  })
  app.register(FastifyCookie)
  // app.register(FastifySession)

  app.get('/healthz', function (req, res) {
    res.status(200).send()
  })

  /**
   * Register all routes
   */
  app.register(routerPlugin)

  /**
   * Adds shortcut .html to FastifyReply for sending HTML content
   */
  app.decorateReply('html', function (this: FastifyReply, content: string) {
    this.type('text/html; charset=utf-8').send(content)
  })

  // app.decorateReply('render', async function <P, L>(this: FastifyReply, options: RenderRouteOptions<P, L>) {
  //   let template = await getTemplate(this.request.url)
  //   let result = await renderRoute<P, L>(options, this.request, template)
  //   this.html(result)
  // })

  app.decorateReply('renderFragment', async function <P>(this: FastifyReply, options: RenderFragmentOptions<P>) {
    let result = await renderComponent<P>(options, this.request)
    this.html(result)
  })

  /**
   * Custom error handler for rendering ##/layouts/error.tsx
   */
  app.setErrorHandler(async function (error, request, reply) {
    isDev && vite.ssrFixStacktrace(error)
    // Log error
    this.log.error(error)
    /**
     * Try sending error response, fallback catch for errors thrown in renderRoute
     */
    try {
      let errorHead = { title: 'Error' }

      await reply.status(error.statusCode ?? 500).render({
        component: ErrorLayout,
        head: errorHead,
        props: { error },
      })
    } catch (e) {
      this.log.error(error)
      let errorMessage = 'There was an error processing your request. Please try again later.'
      if (isDev && error.stack) errorMessage += '\n\n' + error.stack
      reply.status(500).send(errorMessage)
    }
  })

  return app
}
export const renderRouteDefault = renderRoute
