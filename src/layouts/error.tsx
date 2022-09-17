import { h, FunctionComponent, Fragment } from 'preact'
import { FastifyError } from 'fastify'
import { isDev } from '##/lib/util'

export const ErrorLayout: FunctionComponent<{ error: FastifyError }> = ({ error }) => {
  let statusCode = error.statusCode ?? 500
  return (
    <Fragment>
      <h1>Error: {statusCode}</h1>
      <p>
        {statusCode === 500 ? 'There was an error processing your request. Please try again later.' : error.message}
      </p>
      {isDev && <pre>{error.stack}</pre>}
    </Fragment>
  )
}
