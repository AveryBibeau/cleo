# TSX + Fastify

SSR with Fastify+Vite using Preact. No isomorphic rendering by default. Bring your own client-side scripting.

## Dev
1. `pnpm install`
2. `pnpm dev`

## Build
1. `pnpm install`
2. `pnpm build`
3. `pnpm start`

---

## Path aliases
The prefix `##` is aliased to the `./src` directory and can be used in all supported client+server files.

## Static files
All files and directories in `./public` are mounted to the root.

## Router
Routes can be consolidated using the patterns found in `##/router.ts` and `##/routes/example.tsx`.

The `RequestHandler` type can be extended with the same options as Fastify's `RouteGenericInterface`, i.e. `RequestHandler<{ Params: { foo: string }, Querystring: { bar: string } }>`. Request handler type definitons can be applied to Fastify's schema validation using [@sinclair/typebox](https://github.com/sinclairzx81/typebox)


