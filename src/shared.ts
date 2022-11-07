import { UserConfig } from 'vite'
import path from 'path'

export const fastifyOpts = {
  // ajv: {
  //   customOptions: {
  //     strict: 'log',
  //     keywords: ['kind', 'modifier'],
  //   },
  // },
  // genReqId() {
  //   return uuid()
  // },
  // logger: {
  //   redact: {
  //     paths: ['headers.authorization'],
  //     remove: false,
  //     censor: '[redacted]',
  //   },
  // },
}

export const includesPath = './.cleo'

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

export const routesGlob = ['/routes/**/*.{ts,tsx,js,jsx}', '!/routes/**/_*.{ts,tsx,js,jsx}']
