import { UserConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { globby } from 'globby'
import { includeCleo } from './lib/includes.js'
import { createRouteIncludes } from './lib/parseRoutes.js'

// The project root
export const root = process.cwd()

// The library root
export const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const includesPath = './.cleo'
export const isDev = process.env.NODE_ENV === 'development'

export function baseViteConfig(): UserConfig {
  const root = process.cwd()

  return {
    root,
    appType: 'custom',
    esbuild: {
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
    },
    build: {
      target: 'es2020',
      polyfillModulePreload: false,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          format: 'esm',
        },
      },
    },
    ssr: {
      external: ['@ordinal/cleo'],
      target: 'node',
      optimizeDeps: { include: ['preact', 'preact/hooks'] },
    },

    server: {
      watch: { usePolling: true },
    },
    resolve: {
      alias: {
        '##': path.resolve(root, './'),
        '#app': path.resolve(root, './.cleo/index.ts'),
      },
      dedupe: ['preact'],
    },
  }
}

export const routesGlob = [`${root}/routes/**/*.{ts,tsx,js,jsx}`, `!${root}/routes/**/_*.{ts,tsx,js,jsx}`]

export async function initializeRoutes() {
  // Create the initial includes files
  // Find all the routes
  let routeFilePaths = await globby(routesGlob)
  let { routeOptionsString, routeDefinitionsString } = createRouteIncludes(routeFilePaths, root)
  await includeCleo({ routeDefinitions: routeDefinitionsString, routeOptions: routeOptionsString })

  return routeFilePaths
}
