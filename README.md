**Cleo** is a [Vite](https://github.com/vitejs/vite) plugin for building server rendered websites with [Fastify](https://github.com/fastify/fastify) and [Preact](https://github.com/preactjs/preact)

<!-- Begin site docs -->

## Features

- Templates using TSX/JSX
- Type-safe Fastify handlers
- File system based routing
- No isomorphic rendering
- No client-side routing
- HTML partial responses
- Vite HMR during development
- Production SSR builds, or SSG
- Bring your own client-side scripts

## Why

Isomorphic JavaScript frameworks (e.g. Next.js, Nuxt, SvelteKit) have greatly improved the tools for building dynamic web applications. However, not all projects need the pros and cons associated with universal rendering.

Cleo combines a modern developer experience with the simplicity of only rendering on the server. TSX is used to build components and pages with type-safe data binding. Vite provides an extensible build system and hot module reloading in development. Routes are registered automatically from the file system and allow the full use of the Fastify ecosystem with type-safe route schemas.

## Getting Started

Run `npm create cleo@latest <project-name>`

Inside the new directory, install dependencies using your preferred package manager. Run the `dev` script to start the Vite development server. Use the `build` script to create a production build. The `start` script will load the production server.

## Imports

`##` is aliased to the root directory of your project. Cleo also auto-imports useful functions including `TypeBox` for creating type-safe route schemas, `createRequestHandler` for registering routes, `getHref` for generating links, and `Helmet` for customizing the `<head>` element.

## Routing

Files in the `##/routes/` directory are crawled for route definitions. Named exports of HTTP verbs are registered with the Fastify server. A `name` export can be used to provide a custom name for the given route.

The `createRequestHandler` method is auto-imported and is needed for type-safe route schemas.

```tsx
// ##/routes/blog/[slug].tsx
// => GET /blog/:slug

export const name = 'BlogDetail'
export const get = createRequestHandler({
  schema: {
    params: TypeBox.Object({
      slug: TypeBox.String(),
    }),
  },
  async handler(req, res) {
    let { slug } = req.params // slug: string

    // Fetch the blog post

    return res.render({
      component: () => <h1>A blog post with slug: {slug}</h1>,
    })
  },
})
```

- Route parameters can be registered using `[param]` in the filename.
- Wildcard routes can be registered using `[...param]` in the filename. The wildcard value will be available as `request.params['*']`.
- Files named `index` will be registered as the root for their directory. Index routes can also be registered by creating a file such as `(posts).tsx` for easier file navigation.
- Files beginning with `_` will be ignored.
- The optional `name` export must be a string literal.
- Route handler exports may use uppercase or lowercase HTTP verb names. The uppercase `DELETE` is required to register `DELETE` routes, since the lowercase name is a reserved word.

The `getHref` method is auto-imported and can be used to generate links to routes. The name argument will be limited to detected and generated route names. The params argument will include required route params based on the route's path.

```tsx
// Given the above BlogDetail route, use this anywhere in your app
const linkToBlogPost = getHref({
  name: 'BlogDetail',
  params: { slug: 'foo' },
})
```

## Configuration

The `##/cleo.config.ts` file can be used to customize the server's behavior.

```ts
import { defineCleoConfig } from '@ordinal/cleo'
export default defineCleoConfig(async ({ isDev, prerender }) => {
  return {
    hooks: {
      // Hooks will run while creating the Fastify server
      fastifyHooks: [
        async (app, { isDev, prerender }) => {
          app.addHook('onRequest', async (req, res) => {
            // ...
          })
        },
      ],
      // Hooks will run before rendering the route's component.
      // "options" includes anything passed to "res.render"
      beforeRenderPage: [
        async (req, res, options) => {
          // ...
        },
      ],
      // Hooks will run after rendering the route's component,
      // before sending the HTML string "template". Useful for
      // replacing placeholders in "index.html" for e.g. a CSP nonce
      afterRenderPage: [
        (req, res, template) => {
          // ...
          return template
        },
      ],
    },
    // FastifyServerOptions passed when creating the server
    fastifyOpts: {
      // e.g.
      // ignoreTrailingSlash: true,
      // logger: true,
    },
  }
})
```

## Prerendering

In your `vite.config.ts`

```ts {5}
import { defineConfig } from 'vite'
import { cleo } from '@ordinal/cleo'
export default defineConfig(() => {
  return {
    plugins: [cleo({ prerender: true })],
  }
})
```

Then, run the `build` command. Static routes will automatically be generated and the `##/dist/` folder can be served statically.

Dynamic routes can be added for generation using the `generate.addPaths` option in your `cleo.config.ts`.

```ts {6-8}
import { defineCleoConfig } from '@ordinal/cleo'
export default defineCleoConfig(async ({ isDev, prerender }) => {
  return {
    generate: {
      // An array or a function that returns an array of paths to generate during prerendering
      addPaths: async () => {
        // ...
        return []
      },
    },
  }
})
```

## Helmet

Cleo supports and auto-imports [`react-helmet`](https://github.com/nfl/react-helmet/) via `preact-compat`

```tsx
// ##/components/About.tsx
import { FunctionComponent } from 'preact'

export const About: FunctionComponent = ({ children }) => (
  <div>
    <Helmet>
      <title>About</title>
      <meta name="description" content="An about page description using React Helmet" />
    </Helmet>
  </div>
)
```

## Layouts

Cleo will automatically load the files `##/layouts/default.tsx` and `##/layouts/error.tsx` to override the built-in [default](https://github.com/averybibeau/cleo/blob/master/packages/cleo/src/layouts/default.tsx) and [error](https://github.com/averybibeau/cleo/blob/master/packages/cleo/src/layouts/error.tsx) layouts. A default export must be used to provide a layout override.

```ts
// ##/layouts/default.tsx
import { FunctionComponent } from 'preact'

const DefaultLayout: FunctionComponent = ({ children }) => (
  <>
    <header>Cleo - default layout override</header>
    <main>{children}</main>
  </>
)

export default DefaultLayout
```

Layouts can also be specified when calling the `res.render` function using the `layout` property. The `layoutProps` property will be typed based on the provided layout.

## Type provider

Cleo uses `@sinclair/typebox` with `ajv` by default, as recommended by Fastify. You can also use [`fastify-type-provider-zod`](https://github.com/turkerdev/fastify-type-provider-zod) by modifying your `vite.config.ts`.

```ts {5}
import { defineConfig } from 'vite'
import { cleo } from '@ordinal/cleo'
export default defineConfig(() => {
  return {
    plugins: [cleo({ typeProvider: 'zod' })],
  }
})
```

The `createRequestHandler` type will be updated to use `ZodTypeProvider`. Then, add the validator and serializer compilers in your `cleo.config.ts`

```ts {7-10}
import { defineCleoConfig } from '@ordinal/cleo'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'

export default defineCleoConfig(async ({ isDev, prerender }) => ({
  hooks: {
    fastifyHooks: [
      (app) => {
        app.setValidatorCompiler(validatorCompiler)
        app.setSerializerCompiler(serializerCompiler)
      },
    ],
  },
}))
```

`zod` will be auto-imported and can be used when defining schemas within `createRequestHandler`

```tsx
export const get = async (app) =>
  createRequestHandler({
    schema: {
      querystring: zod.object({
        name: zod.optional(zod.string()),
      }),
    },
    async handler(req, res) {
      return await res.render({
        component: () => <h1>Hello world! {req.query.name ?? ''}</h1>,
      })
    },
  })
```

<!-- End site docs -->
