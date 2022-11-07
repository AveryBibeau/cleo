import { CleoConfig } from '../cleoConfig.js'
import { ConfigEnv, mergeConfig, Plugin, ResolvedConfig, build } from 'vite'
import { baseViteConfig } from '../shared.js'
import { createDevServer } from '../dev.js'

export { getHref as originalGetHref, createRouterConfig } from '../lib/routes.js'
export { requestContext } from '@fastify/request-context'

import checker from 'vite-plugin-checker'
import AutoImport from 'unplugin-auto-import/vite'
import path from 'path'
import { globby } from 'globby'
import { includeCleo } from '../lib/includes.js'
import { createRouteIncludes } from '../lib/parseRoutes.js'
import { fileURLToPath } from 'url'

import { pathExists } from 'fs-extra'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = process.cwd()

export async function chainBuild(cleoConfig: CleoConfig = {}): Promise<Plugin> {
  let viteConfig: ResolvedConfig
  let isStatic: boolean = !!cleoConfig.generate

  return {
    name: 'vite-plugin-cleo:ssr-build',
    apply: 'build',
    configResolved(config) {
      viteConfig = config
    },
    /**
     * Build server after client successfully builds
     */
    async writeBundle() {
      if (!viteConfig.build?.ssr) {
        await build({
          build: {
            ssr: true,
          },
        })

        if (isStatic) {
          let generateModule = await import(path.resolve(root, './dist/server/generate.js'))

          await generateModule.generate()
        }
      }
    },
  }
}

export async function cleo(cleoConfig: CleoConfig = {}): Promise<Plugin[]> {
  let viteConfig: ResolvedConfig
  let viteConfigEnv: ConfigEnv
  let isBuild: boolean
  let isStatic: boolean = !!cleoConfig.generate

  return [
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
          return mergeConfig(baseConfig, {
            build: {
              outDir: process.cwd() + '/dist/client',
            },
          })
        }
        // Follow up (server) build
        else if (configEnv.ssrBuild) {
          return mergeConfig(baseConfig, {
            build: {
              sourcemap: true,
              ssr: isStatic ? path.resolve(__dirname, '../generate.js') : path.resolve(__dirname, '../prod.js'),
              outDir: path.resolve(root, './dist/server'),
            },
          })
        }

        return baseConfig
      },

      async configResolved(config) {
        viteConfig = config
      },

      async buildStart() {
        if (viteConfigEnv.command === 'build' && !viteConfigEnv.ssrBuild) {
          // Create the initial includes files
          // Find all the routes
          let routeFilePaths = await globby([
            root + '/routes/**/*.{ts,tsx,js,jsx}',
            '!' + root + '/routes/**/_*.{ts,tsx,js,jsx}',
          ])
          let { routeOptionsString, routeDefinitionsString } = createRouteIncludes(routeFilePaths, root)
          await includeCleo({ routeDefinitions: routeDefinitionsString, routeOptions: routeOptionsString })
        }
      },

      // Creates the Vite dev server
      async configureServer(vite) {
        console.log('configureServer')
        return async () => {
          await createDevServer(vite)
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
          '@sinclair/typebox': [['Type', 'TypeBox']],
          '#app': ['createRequestHandler', 'getHref'],
        },
      ],
      dts: './.cleo/@types/auto-imports.d.ts',
    }),
    chainBuild(cleoConfig),
  ]
}
