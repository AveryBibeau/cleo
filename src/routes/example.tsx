import { RequestHandler } from '##/lib/util'
import { FunctionComponent, h } from 'preact'

const MessageComponent: FunctionComponent<{ message: string }> = ({ message }) => <p>Lorem ipsum: {message}</p>

export const SampleHandler: RequestHandler = {
  async handler(request, reply) {
    let a: string = 'asdf'
    return reply.render({
      component: MessageComponent,
      props: {
        message: 'Example route',
      },
    })
  },
}

/**
 * Function handlers will have access to the Fastify instance outside of the handler function,
 * i.e. for accessing decorators in the handler config
 */
// export function SampleHandler(app: FastifyInstance): RequestHandler {
//   return {
//     preHandler: app.auth([app.verifyUserSession]),
//     async handler(request, reply) {
//       return reply.render({
//         component: MessageComponent,
//         props: {
//           message: 'Example route',
//         },
//       })
//     },
//   }
// }
