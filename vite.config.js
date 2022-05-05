// vite.config.js
import { defineConfig } from 'vite'
import path from 'path'
import checker from 'vite-plugin-checker'

// https://vitejs.dev/config/
export default defineConfig((ctx) => {
  let isServer = process.env.VITE_BUILD === 'ssr'
  return {
    build: {
      target: 'es2020',
      polyfillModulePreload: false,
      sourcemap: isServer,
    },
    resolve: {
      alias: {
        '##': path.resolve(__dirname, './src'),
      },
    },
    plugins: [checker({ typescript: true })],
  }
})
