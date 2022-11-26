export const name = 'home'

export const get = async (app) =>
  createRequestHandler({
    schema: {
      querystring: TypeBox.Object({
        foo: TypeBox.Optional(TypeBox.String()),
      }),
    },
    async handler(req, res) {
      return await res.render({
        component: () => (
          <div>
            <h1>Hello world!</h1>
          </div>
        ),
      })
    },
  })
