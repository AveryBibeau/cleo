import Fastify from 'fastify'
import FastifySensible from 'fastify-sensible'

import { h } from 'preact'

import { renderPage } from './lib/view/render.js'

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

app.register(FastifySensible)

app.get('/', async function (request, reply) {
  const Page = () => <p>Some page content</p>

  let result = renderPage(<Page></Page>)

  reply.type('text/html; charset=utf-8').send(result)
})

app.get('/healthz', function (req, res) {
  res.status(200).send()
})

export default app
