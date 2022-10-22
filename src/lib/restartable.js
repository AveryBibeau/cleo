/**
 * Adapted from https://github.com/fastify/restartable
 * to include an async hook after app load in spinUpFastify
 * @fastify/middie cannot load vite dev middleware when registered as
 * a subsystem (the app with middlewares is passed to another app via register)
 */

import Fastify from 'fastify'
import http from 'http'
import https from 'https'
import { once } from 'events'
import createError from '@fastify/error'

const FST_RST_UNKNOWN_PROTOCOL = createError('FST_RST_UNKNOWN_PROTOCOL', 'Unknown Protocol %s')

function buildServer({ protocol = 'http', port, hostname = '127.0.0.1', key, cert }) {
  let server

  switch (protocol) {
    case 'http':
      server = http.createServer()
      break
    case 'https':
      server = https.createServer({ key, cert })
      break
    default:
      throw new FST_RST_UNKNOWN_PROTOCOL(protocol)
  }

  return {
    server,
    protocol,
    get address() {
      return server.address().address
    },
    get port() {
      return server.address().port
    },
    async listen() {
      server.listen(port, hostname)
      await once(server, 'listening')
      return server.address()
    },
    async close() {
      server.close()
      await once(server, 'close')
    },
  }
}
export async function start(opts) {
  const serverWrapper = buildServer(opts)

  let listening = false
  let stopped = false
  let handler

  const res = {
    app: await (await spinUpFastify(opts, serverWrapper, restart, true)).ready(),
    restart,
    get address() {
      if (!listening) {
        throw new Error('Server is not listening')
      }
      return serverWrapper.address
    },
    get port() {
      if (!listening) {
        throw new Error('Server is not listening')
      }
      return serverWrapper.port
    },
    inject(...args) {
      return res.app.inject(...args)
    },
    async listen() {
      await serverWrapper.listen()
      listening = true
      res.app.log.info(
        { url: `${opts.protocol || 'http'}://${serverWrapper.address}:${serverWrapper.port}` },
        'server listening'
      )
      return {
        address: serverWrapper.address,
        port: serverWrapper.port,
      }
    },
    stop,
  }

  res.app.server.on('request', handler)

  return res

  async function restart(_opts = opts) {
    const old = res.app
    const oldHandler = handler
    const clientErrorListeners = old.server.listeners('clientError')
    const newApp = await spinUpFastify(_opts, serverWrapper, restart)
    try {
      await newApp.ready()
    } catch (err) {
      const listenersNow = newApp.server.listeners('clientError')
      handler = oldHandler
      // Creating a new Fastify apps adds one clientError listener
      // Let's remove all the new ones
      for (const listener of listenersNow) {
        if (clientErrorListeners.indexOf(listener) === -1) {
          old.server.removeListener('clientError', listener)
        }
      }
      await newApp.close()
      throw err
    }

    // Remove the old handler and add the new one
    // the handler variable was updated in the spinUpFastify function
    old.server.removeListener('request', oldHandler)
    newApp.server.on('request', handler)
    for (const listener of clientErrorListeners) {
      old.server.removeListener('clientError', listener)
    }
    res.app = newApp

    await old.close()
  }

  async function stop() {
    if (stopped) {
      return
    }
    stopped = true
    const toClose = []
    if (listening) {
      toClose.push(serverWrapper.close())
    }
    toClose.push(res.app.close())
    await Promise.all(toClose)
    res.app.log.info('server stopped')
  }

  async function spinUpFastify(opts, serverWrapper, restart, isStart = false) {
    const server = serverWrapper.server
    const _opts = Object.assign({}, opts)
    _opts.serverFactory = function (_handler) {
      handler = _handler
      return server
    }
    const app = Fastify(_opts)

    app.decorate('restart', restart)
    app.decorate('restarted', !isStart)
    app.register(opts.app, opts)

    if (opts.rootAppHook) {
      await opts.rootAppHook(app)
    }

    return app
  }
}
