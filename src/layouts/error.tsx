import { h, FunctionComponent, Fragment } from 'preact'
import { FastifyError } from 'fastify'
import { isDev } from '##/lib/util'

export const ErrorLayout: FunctionComponent<{ error: FastifyError }> = ({ error }) => (
  <Fragment>
    <h1>Error: {error.statusCode ?? 500}</h1>
    <p>{error.message}</p>
    {isDev && <pre>{error.stack}</pre>}
  </Fragment>
)
