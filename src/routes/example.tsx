import { AppInstance } from '##/app'
import { createRequestHandler } from '##/lib/util'
import { Type } from '@sinclair/typebox'
import { FunctionComponent, h } from 'preact'

const MessageComponent: FunctionComponent<{ message?: string }> = ({ message }) => <p>Lorem ipsum: {message}</p>

export const HomeGet = (app: AppInstance) =>
  createRequestHandler({
    schema: {
      querystring: Type.Object({
        foo: Type.Optional(Type.String()),
      }),
    },
    async handler(request, reply) {
      let { foo } = request.query // foo: string | undefined
      return await reply.render({
        component: MessageComponent,
        props: {
          message: foo,
        },
      })
    },
  })
