import Fastify, { FastifyReply } from 'fastify'
import FastifyStatic from '@fastify/static'
import FastifySensible from '@fastify/sensible'
import FastifyCookie from '@fastify/cookie'
import FastifySession from '@fastify/session'
import FastifyAuth from '@fastify/auth'
import FastifyCors from '@fastify/cors'
import FastifyHelmet from '@fastify/helmet'
import FastifyFormBody from '@fastify/formbody'
import FastifyCrfs from '@fastify/csrf-protection'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

import { verifyUserSession } from '##/lib/authorization'

import { renderRoute, renderComponent, RenderRouteOptions, RenderFragmentOptions } from '##/lib/view/render'
import ErrorLayout from '##/layouts/error'

import { __dirname, isDev } from '##/lib/util'
import { v4 as uuid } from 'uuid'
import type { FastifyAuthFunction } from '@fastify/auth'
import { routerPlugin } from '##/router'
import { Session as SessionType } from '##/lib/view/context'
import { ViteDevServer } from 'vite'

declare module 'fastify' {
  export interface Session extends SessionType {}
  export interface FastifyInstance {
    verifyUserSession: FastifyAuthFunction
  }
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
    ajv: {
      customOptions: {
        strict: 'log',
        keywords: ['kind', 'modifier'],
      },
    },
    genReqId() {
      return uuid()
    },
    logger: {
      redact: {
        paths: ['headers.authorization'],
        remove: false,
        censor: '[redacted]',
      },
      transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
  }).withTypeProvider<TypeBoxTypeProvider>()

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

  if (!isDev) app.register(FastifyHelmet)

  app.register(FastifySensible)
  app.register(FastifyCookie)

  app.register(FastifySession, {
    secret: process.env.SESSION_SECRET,
    cookieName: 'session',
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !isDev,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 90d
      path: '/',
      sameSite: 'lax',
    },
  })
  app.register(FastifyCrfs, {
    sessionPlugin: '@fastify/session',
  })

  app.register(FastifyAuth)

  app.register(FastifyCors, {
    credentials: true,
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    origin: process.env.ORIGIN,
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'X-Access-Token'],
  })
  app.register(FastifyFormBody)

  // TODO: Track https://github.com/fastify/fastify/issues/4081
  // FastifyInstance defined in FastifyAuthFunction does not inherit the TypeBoxTypeProvider
  app.decorate('verifyUserSession', verifyUserSession as any)

  app.decorateReply('html', function (this: FastifyReply, content: string) {
    return this.type('text/html; charset=utf-8').send(content)
  })

  app.decorateReply('renderFragment', async function <P>(this: FastifyReply, options: RenderFragmentOptions<P>) {
    let result = await renderComponent<P>(options, this.request)
    return this.html(result)
  })

  // Register all routes
  app.register(routerPlugin as any)

  // Custom error handler for rendering ##/layouts/error.tsx
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

  app.get('/healthz', function (req, res) {
    return res.status(200).send()
  })

  return app
}
export const renderRouteDefault = renderRoute

export type AppInstance = ReturnType<typeof createApp>
