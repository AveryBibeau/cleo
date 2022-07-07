import type { FastifyAuthFunction } from '@fastify/auth'

export const verifyUserSession: FastifyAuthFunction = function (req, res, done) {
  if (!req.session.user) {
    res.unauthorized()
  } else {
    done()
  }
}
