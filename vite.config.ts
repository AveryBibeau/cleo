import { defineConfig } from 'vite'
import path from 'path'
import checker from 'vite-plugin-checker'
import { fileURLToPath } from 'url'
import analyze from 'rollup-plugin-analyzer'

import { createRequire } from 'module'

const require = createRequire(import.meta.url)

import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig(({ mode, command }) => {
  const isDev = mode === 'development'
  const isServer = process.env.VITE_BUILD === 'ssr'
  const isGenerate = !!process.env.VITE_GENERATE
  const root = process.cwd()
  const __dirname = path.dirname(fileURLToPath(import.meta.url))

  return {
    root,
    appType: 'custom',
    esbuild: {
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
    },

    // optimizeDeps: {
    //   include: ['preact', 'preact/hooks'],
    // },
    build: {
      target: 'es2020',
      polyfillModulePreload: false,
      sourcemap: isServer,
      rollupOptions: {
        plugins: [analyze],
        output: {
          format: 'esm',
        },
      },

      ssr: isServer
        ? isGenerate
          ? path.resolve(__dirname, './dist/generate.js')
          : path.resolve(__dirname, './dist/prod.js')
        : undefined,
      outDir: isServer ? process.cwd() + '/dist/server' : process.cwd() + '/dist/client',
    },

    server: {
      watch: { usePolling: true },
      middlewareMode: true,
    },
    resolve: {
      alias: {
        '##': path.resolve(root, './'),
        '#app': path.resolve(root, './.cleo/index.ts'),
      },
      dedupe: ['preact'],
    },
    plugins: [
      checker({ typescript: true }),
      // Note: preact auto imports with "jsxImportSource": "preact" in tsconfig.json required version match for preact
      // between cleo and project
      AutoImport({
        imports: [
          {
            preact: ['h'],
            '@sinclair/typebox': [['Type', 'TypeBox']],
            '#app': ['createRequestHandler', 'getHref'],
          },
        ],
        dts: './.cleo/@types/auto-imports.d.ts',
      }),
    ],
    ssr: {
      target: 'node',
      external: ['fastify', 'preact/hooks', 'preact'],
      optimizeDeps: { include: ['preact', 'preact/hooks'] },
    },
  }
})
