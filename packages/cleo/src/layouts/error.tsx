import { h, FunctionComponent, Fragment } from 'preact'
import { FastifyError } from 'fastify'
import { isDev } from '../shared.js'

export const ErrorLayout: FunctionComponent<{ error: FastifyError }> = ({ error }) => (
  <Fragment>
    <h1>Error: {error.statusCode ?? 500}</h1>
    {error.message && <p>{error.message}</p>}
    {isDev && error.stack && <pre>{error.stack}</pre>}
  </Fragment>
)
