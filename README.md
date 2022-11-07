# Cleo

SSR with Fastify using Preact components.  
No isomorphic rendering by default.  
Bring your own client-side scripting.

## Features

### Path aliases

The prefix `##` is aliased to the project root.

### Static files

All files and directories in `./public` are mounted to the root.

### Routing

Routes are automatically generated from the `/routes` directory. Files can export named method handlers (e.g. `export const get` using the `createRequestHandler` helper to register routes with the Fastify server.

Dynamic route parameters can be added using square brackets, e.g. `/routes/user/[slug].tsx` will create a Fastify route with the path `/user/:slug`. Wildcards can also be added, e.g. `/routes/admin/[...slug]` will create a Fastify route with the path `/routes/admin/*`

Route names and type definitions are automatically generated. The `getHref` helper can be used to build URLs based on route names, route parameters, and query parameters.
