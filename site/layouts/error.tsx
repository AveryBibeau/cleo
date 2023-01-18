import { h, FunctionComponent, Fragment } from 'preact'
import { FastifyError } from 'fastify'
import DefaultLayout from '##/layouts/default'

const ErrorLayout: FunctionComponent<{ error: FastifyError }> = ({ error }) => (
  <DefaultLayout>
    <div className="bg-red-100 p-4 rounded-xl">
      <h1 class="text-2xl font-bold">{error.statusCode ?? 500}</h1>
      {error.message && <p>{error.message}</p>}
      <a href="/">Return</a>
      {process.env.NODE_ENV === 'development' && <pre>{error.stack}</pre>}
    </div>
  </DefaultLayout>
)

export default ErrorLayout
