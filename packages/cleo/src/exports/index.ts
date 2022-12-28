import { ConfigEnv, mergeConfig, Plugin, ResolvedConfig, build } from 'vite'
import { baseViteConfig } from '../shared.js'
import { createDevServer } from '../dev.js'

import checker from 'vite-plugin-checker'
import AutoImport from 'unplugin-auto-import/vite'
import path from 'path'
import { globby } from 'globby'
import { CleoTypeProviderOpts, includeCleo } from '../lib/includes.js'
import { createRouteIncludes } from '../lib/parseRoutes.js'
import { fileURLToPath } from 'url'

import fs from 'fs-extra'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = process.cwd()

import { RenderRouteOptions, RenderFragmentOptions } from '../lib/view/render.js'
export { SharedRenderRouteOptions } from '../lib/view/render.js'
export { RouteInfo } from '../lib/routes.js'
export { getHref as originalGetHref, createRouterConfig } from '../lib/routes.js'
export { defineCleoConfig, CleoConfig, CleoConfigCtx } from '../cleoConfig.js'
export { Helmet } from 'react-helmet'
export { DefaultLayoutProps } from '../layouts/default.js'

declare module 'fastify' {
  interface FastifyReply {
    html: (content: string) => FastifyReply
    render: <P, L>(options: RenderRouteOptions<P, L>) => FastifyReply
    renderFragment: <P>(options: RenderFragmentOptions<P>) => FastifyReply
  }
}

export interface CleoPluginOpts {
  prerender?: boolean
  typeProvider?: CleoTypeProviderOpts
}

export function ensureCleoDirs(): Plugin {
  return {
    name: 'vite-plugin-cleo:ensure-cleo-dirs',
    enforce: 'pre',
    // AutoImport needs the output directory to exist before writing the file
    async configResolved() {
      await fs.ensureDir(path.resolve(root, './.cleo/@types/'))
      await fs.copyFile(
        path.resolve(__dirname, '../../src/includes/tsconfig.json'),
        path.resolve(root, './.cleo/tsconfig.json')
      )
    },
  }
}

export async function chainBuild(opts: CleoPluginOpts): Promise<Plugin> {
  let viteConfig: ResolvedConfig

  return {
    name: 'vite-plugin-cleo:ssr-build',
    apply: 'build',
    async config(config, configEnv) {},
    configResolved(config) {
      viteConfig = config
    },
    /**
     * Build server after client successfully builds
     */
    async writeBundle() {
      if (!viteConfig.build?.ssr) {
        if (opts.prerender) console.info('Building production server for prerendering')
        await build({
          build: {
            ssr: true,
          },
          logLevel: opts.prerender ? 'warn' : 'info',
        })

        if (opts.prerender) {
          console.info('Generating pages...')
          let generateModule = await import(path.resolve(root, './dist/server/generate.js'))
          await generateModule.generate()
        }
      }
    },
  }
}

export async function cleo(opts: CleoPluginOpts = {}): Promise<Plugin[]> {
  let viteConfig: ResolvedConfig
  let viteConfigEnv: ConfigEnv
  let isBuild: boolean

  return [
    ensureCleoDirs(),
    {
      name: 'vite-plugin-cleo',
      /**
       * @see https://vitejs.dev/guide/api-plugin.html#config
       */
      async config(config, configEnv) {
        viteConfigEnv = configEnv
        isBuild = configEnv.command === 'build'

        let baseConfig = mergeConfig(config, baseViteConfig())
        // Initial (client) build
        if (configEnv.command === 'build' && !viteConfigEnv.ssrBuild) {
          await fs.remove(path.resolve(root, './dist'))
          return mergeConfig(baseConfig, {
            build: {
              outDir: path.resolve(root, './dist/client'),
            },
          })
        }
        // Follow up (server) build
        else if (configEnv.ssrBuild) {
          return mergeConfig(baseConfig, {
            build: {
              sourcemap: true,
              ssr: opts.prerender ? path.resolve(__dirname, '../generate.js') : path.resolve(__dirname, '../prod.js'),
              outDir: path.resolve(root, './dist/server'),
              copyPublicDir: false,
            },
          })
        }

        return baseConfig
      },

      async configResolved(config) {
        viteConfig = config
      },

      async buildStart() {
        if (!viteConfigEnv.ssrBuild && viteConfigEnv.command === 'build') {
          // Create the initial includes files
          // Find all the routes
          let routeFilePaths = await globby([
            root + '/routes/**/*.{ts,tsx,js,jsx}',
            '!' + root + '/routes/**/_*.{ts,tsx,js,jsx}',
          ])

          let { routeOptionsString, routeDefinitionsString } = await createRouteIncludes(routeFilePaths, root)
          await includeCleo({
            routeDefinitions: routeDefinitionsString,
            routeOptions: routeOptionsString,
            typeProvider: opts.typeProvider,
          })
        }
      },

      // Creates the Vite dev server
      async configureServer(vite) {
        process.env.NODE_ENV = 'development'
        return async () => {
          await createDevServer(vite, viteConfigEnv, opts.typeProvider)
        }
      },
    },
    checker({ typescript: true }),
    // Note: preact auto imports with "jsxImportSource": "preact" in tsconfig.json required version match for preact
    // between cleo and project
    AutoImport({
      imports: [
        {
          preact: ['h', 'Fragment'],
          '#app': ['createRequestHandler', 'getHref', 'Helmet'],
          ...(opts.typeProvider === 'zod' ? { zod: [['z', 'zod']] } : { '@sinclair/typebox': [['Type', 'TypeBox']] }),
        },
      ],
      // TODO: This fails if included in the ./.cleo/@types directory if the directory doesn't exist yet
      dts: './.cleo/@types/auto-imports.d.ts',
    }),
    chainBuild(opts),
  ]
}
