import Fastify, { FastifyReply } from 'fastify'
import FastifySensible from 'fastify-sensible'

import { h, FunctionComponent } from 'preact'

import { initializeRenderDefaults, renderRoute } from '##/lib/view/render'
import { defaultHead } from '##/lib/defaults'
import { DefaultLayout } from '##/layouts/default'
import { ErrorLayout } from '##/layouts/error'

initializeRenderDefaults(DefaultLayout, defaultHead)

declare module 'fastify' {
  interface FastifyReply {
    html: (content: string) => FastifyReply
  }
}

const app = Fastify({
  maxParamLength: 1800,
  logger: {
    prettyPrint:
      process.env.NODE_ENV === 'development'
        ? {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          }
        : false,
  },
})

app.register(FastifySensible, { errorHandler: false })

app.get('/', async function (request, reply) {
  const Page: FunctionComponent<{ message: string }> = ({ message }) => <p>Component with a prop: {message}</p>

  let result = renderRoute({ component: Page, props: { message: 'lorem ipsum' } })

  reply.html(result)
})

app.get('/healthz', function (req, res) {
  res.status(200).send()
})

app.decorateReply('html', function (this: FastifyReply, content: string) {
  this.type('text/html; charset=utf-8').send(content)
})

app.setErrorHandler(function (error, request, reply) {
  // Log error
  this.log.error(error)
  // Try sending error response
  try {
    let result = renderRoute({
      component: ErrorLayout,
      props: { error },
    })
    reply.status(error.statusCode ?? 500).html(result)
  } catch (e) {
    reply.status(500).send('There was an error processing your request. Please try again later.')
  }
})

export default app
