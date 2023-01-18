import fastify, { FastifyInstance, FastifyReply } from 'fastify'
import { Fragment } from 'preact'

import { ErrorLayout } from './layouts/error.js'

import { __dirname, isDev } from './shared.js'

export async function createApp(app: FastifyInstance, opts: any) {
  app.decorateReply('html', function (this: FastifyReply, content: string) {
    return this.type('text/html; charset=utf-8').send(content)
  })

  async function errorHandler(
    error: fastify.FastifyError,
    request: fastify.FastifyRequest,
    reply: fastify.FastifyReply
  ) {
    // Skip the error handler and send an empty 401 for basic auth requests
    // See: https://github.com/fastify/fastify-basic-auth
    if (error.statusCode === 401 && reply.getHeader('WWW-Authenticate') === 'Basic') {
      return reply.code(401).send()
    }

    // Log error
    request.log.error(error)

    let errorLayoutToUse = ErrorLayout
    try {
      let maybeUserErrorLayout = Object.values(await import.meta.glob('/layouts/error.{tsx,jsx}'))
      if (maybeUserErrorLayout.length > 0) {
        let userErrorLayout = (await maybeUserErrorLayout[0]()) as any
        if (userErrorLayout.default) {
          errorLayoutToUse = userErrorLayout.default
        }
      }
    } catch (e) {
      // Noop
    }

    /**
     * Try sending error response, fallback catch for errors thrown in renderRoute
     */
    try {
      return await reply.status(error.statusCode ?? 500).render({
        layout: errorLayoutToUse,
        layoutProps: { error },
        component: Fragment,
      })
    } catch (e) {
      request.log.error(e)
      let errorMessage = 'There was an error processing your request. Please try again later.'
      if (isDev && error.stack) errorMessage += '\n\n' + error.stack
      return reply.status(500).send(errorMessage)
    }
  }

  // Custom error handler for rendering error layout
  app.setErrorHandler(async function (error, request, reply) {
    isDev && opts?.ssrFixStacktrace(error)
    return await errorHandler(error, request, reply)
  })

  app.setNotFoundHandler(async function (request, reply) {
    return await errorHandler({ ...fastify.default.errorCodes.FST_ERR_NOT_FOUND(), stack: undefined }, request, reply)
  })

  app.get('/healthz', function (req, res) {
    return res.status(200).send()
  })

  if (opts?.runAfterLoad) await opts.runAfterLoad(app)
}

export type AppInstance = ReturnType<typeof createApp>
