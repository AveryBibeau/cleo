import { CleoConfig } from '../cleoConfig.js'
import { ConfigEnv, mergeConfig, Plugin, ResolvedConfig, build } from 'vite'
import { baseViteConfig } from '../shared.js'
import { createDevServer } from '../dev.js'

import checker from 'vite-plugin-checker'
import AutoImport from 'unplugin-auto-import/vite'
import path from 'path'
import { globby } from 'globby'
import { includeCleo } from '../lib/includes.js'
import { createRouteIncludes } from '../lib/parseRoutes.js'
import { fileURLToPath } from 'url'

import fs from 'fs-extra'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = process.cwd()

export function ensureCleoDirs(): Plugin {
  return {
    name: 'vite-plugin-cleo:ensure-cleo-dirs',
    enforce: 'pre',
    // AutoImport needs the output directory to exist before writing the file
    async configResolved() {
      await fs.ensureDir(path.resolve(root, './.cleo/@types/'))
    },
  }
}

export async function chainBuild(): Promise<Plugin> {
  let viteConfig: ResolvedConfig
  let cleoConfig: CleoConfig
  let isStatic: boolean

  return {
    name: 'vite-plugin-cleo:ssr-build',
    apply: 'build',
    async config(config, configEnv) {
      cleoConfig = config.cleoConfig
      isStatic = !!cleoConfig.generate
    },
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
          await generateModule.generate(cleoConfig)
        }
      }
    },
  }
}

export async function cleo(): Promise<Plugin[]> {
  let viteConfig: ResolvedConfig
  let viteConfigEnv: ConfigEnv
  let isBuild: boolean
  let isStatic: boolean
  let cleoConfig: CleoConfig

  return [
    ensureCleoDirs(),
    {
      name: 'vite-plugin-cleo',
      /**
       * @see https://vitejs.dev/guide/api-plugin.html#config
       */
      async config(config, configEnv) {
        cleoConfig = config.cleoConfig

        viteConfigEnv = configEnv
        isBuild = configEnv.command === 'build'

        isStatic = !!cleoConfig.generate

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
              ssr: isStatic ? path.resolve(__dirname, '../generate.js') : path.resolve(__dirname, '../prod.js'),
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
        if (!viteConfigEnv.ssrBuild) {
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
        process.env.NODE_ENV = 'development'
        return async () => {
          await createDevServer(vite, cleoConfig as CleoConfig)
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
          '#app': ['createRequestHandler', 'getHref', 'Helmet'],
        },
      ],
      // TODO: This fails if included in the ./.cleo/@types directory if the directory doesn't exist yet
      dts: './.cleo/@types/auto-imports.d.ts',
    }),
    chainBuild(),
  ]
}

export { getHref as originalGetHref, createRouterConfig } from '../lib/routes.js'
export { Helmet } from 'react-helmet'
