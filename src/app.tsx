import Fastify, { FastifyReply } from 'fastify'
import FastifySensible from 'fastify-sensible'
import FastifyStatic from 'fastify-static'

import { h, FunctionComponent } from 'preact'

import { renderRoute } from '##/lib/view/render'
import { ErrorLayout } from '##/layouts/error'

import { __dirname, isDev } from '##/lib/util'
import { v4 as uuid } from 'uuid'
import { helmet } from '##/lib/view/helmet'

declare module 'fastify' {
  interface FastifyReply {
    html: (content: string) => FastifyReply
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

const app = Fastify({
  maxParamLength: 1800,
  disableRequestLogging: true,
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
  if (isDev && req.raw.url?.includes('/public/')) return done()
  reply.startTime = performance.now()
  req.log.info({ url: req.raw.url, method: req.method }, '[Request]')
  done()
})
app.addHook('onResponse', (req, reply, done) => {
  if (isDev && req.raw.url?.includes('/public/')) return done()
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

app.register(FastifyStatic, {
  root: __dirname + '/public/',
  prefix: '/public/',
})
app.register(FastifySensible, { errorHandler: false })

/**
 * Adds shortcut .html to FastifyReply for sending HTML content
 */
app.decorateReply('html', function (this: FastifyReply, content: string) {
  this.type('text/html; charset=utf-8').send(content)
})

/**
 * Custom error handler for rendering ##/layouts/error.tsx
 */
app.setErrorHandler(async function (error, request, reply) {
  // Log error
  this.log.error(error)
  /**
   * Try sending error response, fallback catch for errors thrown in renderRoute
   */
  try {
    let errorHead = { title: 'Error' }
    let result = await renderRoute({
      component: ErrorLayout,
      head: errorHead,
      props: { error },
    })
    reply.status(error.statusCode ?? 500).html(result)
  } catch (e) {
    reply.status(500).send('There was an error processing your request. Please try again later.')
  }
})

app.get('/', async function (request, reply) {
  const Page: FunctionComponent<{ message: string }> = ({ message }) => <p>Component with a prop: {message}</p>

  let result = await renderRoute({ component: Page, props: { message: 'lorem ipsum' } })

  reply.html(result)
})

app.get('/healthz', function (req, res) {
  res.status(200).send()
})

export default app
