import { defineConfig } from 'vite'
import path from 'path'
import checker from 'vite-plugin-checker'
import { fileURLToPath } from 'url'

export default defineConfig(({ mode, command }) => {
  const isDev = mode === 'development'
  const isServer = process.env.VITE_BUILD === 'ssr'
  const root = process.cwd()
  const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
      sourcemap: isServer,
      rollupOptions: {
        output: {
          format: 'esm',
        },
      },
      ssr: isServer ? path.resolve(__dirname, './dist/prod.js') : undefined,
      outDir: isServer ? process.cwd() + '/dist/server' : process.cwd() + '/dist/client',
    },
    server: {
      watch: { usePolling: true },
      middlewareMode: true,
    },
    resolve: {
      alias: {
        '##': path.resolve(root, './'),
        '#app': path.resolve(root, './.cleo'),
      },
    },
    plugins: [checker({ typescript: true })],
    ssr: { target: 'node' },
  }
})
