import { UserConfig } from 'vite'

import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const rootDir = import.meta.url

export const __dirname = dirname(fileURLToPath(rootDir))

// The project root
export const root = process.cwd()

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
        '##': resolve(root, './'),
        '#app': resolve(root, './.cleo/index.ts'),
      },
      dedupe: ['preact'],
    },
  }
}
