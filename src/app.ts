import fastify, { FastifyInstance, FastifyReply } from 'fastify'

import { renderRoute, renderComponent, RenderRouteOptions, RenderFragmentOptions } from './lib/view/render.js'
import { ErrorLayout } from './layouts/error.js'

import { __dirname, isDev } from './shared.js'
import { h } from 'preact'

export async function createApp(app: FastifyInstance, opts: any) {
  app.decorateReply('html', function (this: FastifyReply, content: string) {
    return this.type('text/html; charset=utf-8').send(content)
  })

  app.decorateReply('renderFragment', async function <
    P extends h.JSX.IntrinsicAttributes
  >(this: FastifyReply, options: RenderFragmentOptions<P>) {
    let result = await renderComponent<P>(options, this.request)
    return this.html(result)
  })

  async function errorHandler(
    error: fastify.FastifyError,
    request: fastify.FastifyRequest,
    reply: fastify.FastifyReply
  ) {
    // Log error
    request.log.error(error)

    let errorLayoutToUse = ErrorLayout
    try {
      // @ts-ignore
      let userErrorLayout = await import('/layouts/error.tsx')
      if (userErrorLayout.default) {
        errorLayoutToUse = userErrorLayout.default
      }
    } catch (e) {
      // Noop
    }

    /**
     * Try sending error response, fallback catch for errors thrown in renderRoute
     */
    try {
      await reply.status(error.statusCode ?? 500).render({
        component: errorLayoutToUse,
        head: { title: `${error.statusCode} Error` },
        props: { error },
      })
    } catch (e) {
      request.log.error(error)
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
export const renderRouteDefault = renderRoute

export type AppInstance = ReturnType<typeof createApp>
