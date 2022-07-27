import { defineConfig } from 'vite'
import path from 'path'
import checker from 'vite-plugin-checker'

const devPlugins = []

export default defineConfig(({ mode, command }) => {
  const isDev = mode === 'development'
  const isServer = process.env.VITE_BUILD === 'ssr'
  return {
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
    },
    server: {
      watch: { usePolling: true },
    },
    resolve: {
      alias: {
        '##': path.resolve(__dirname, './src'),
      },
    },
    plugins: [...(isDev ? devPlugins : []), checker({ typescript: true })],
  }
})
