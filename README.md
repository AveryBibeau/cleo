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
Routes are automatically generated from the `/routes` directory. Files can export named method handlers (e.g. `export const get` using the `createRequestHandler` helper generated in the `#app` package). `createRequestHandler` options are registered with Fastify under the corresponding method name and path (determined by the file structure).

Dynamic route parameters can be added using square brackets, e.g. `/routes/user/[slug].tsx` will create a Fastify route with the path `/user/:slug`. Wildcards can also be added, e.g. `/routes/admin/[...slug]` will create a Fastify route with the path `/routes/admin/*`

Route names and type definitions are automatically generated. The `getHref` helper from `#app` can be used to build URLs based on route names, route parameters, and query parameters.


## Commands

`cleo dev`: Starts the dev server. Supports HMR for components. Changes to route files will trigger a restart of the Fastify server to register changes to the route definition (e.g. schema)

`cleo build`: Builds a production server for full SSR. The resulting server can be run using `node ./dist/server/prod.js`

`cleo generate`: Creates a static build. Static routes are automatically generated and dynamic routes can be added in `cleo.config.ts`, e.g.
```javascript
export default {
  generate: {
    addPaths: async function () { // addPaths can also be an array of strings
      return ["/post/asdf", "/post/test"];
    },
  },
};
```
