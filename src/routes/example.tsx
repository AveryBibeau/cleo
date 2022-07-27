import { AppInstance } from '##/app'
import { MessageComponent } from '##/components/Message'
import { createRequestHandler } from '##/lib/util'
import { Type } from '@sinclair/typebox'

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
