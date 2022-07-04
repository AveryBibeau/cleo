import dotenv from 'dotenv'
dotenv.config()
import { build } from 'esbuild'
import stylePlugin from 'esbuild-style-plugin'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import manifestPlugin from 'esbuild-plugin-manifest'
import chalk from 'chalk'
import glob from 'glob'
import rimraf from 'rimraf'
import shelljs from 'shelljs'

const isDev = process.env.NODE_ENV === 'development'

// Clear out ./dist
rimraf('./dist', (err) => {
  // Build the server
  console.log(chalk.blueBright('[ESBuild: Server] Building'))

  let serverFiles = glob.sync('./src/**/*.{ts,tsx,js,jsx}', {
    ignore: ['./node_modules/**', './src/client/**'],
  })

  build({
    entryPoints: serverFiles,
    platform: 'node',
    bundle: false,
    outdir: './dist/',
    sourcemap: true,
    minify: false,
    target: 'es2022',
  })
    .then((result) => {
      console.log(chalk.greenBright('[ESBuild: Server] Finished'))
    })
    .catch((e) => {
      process.exit(1)
    })

  // Build the client
  console.log(chalk.blueBright('[ESBuild: Client] Building'))
  build({
    entryPoints: ['./src/client/main.ts'],
    bundle: true,
    outfile: './dist/public/bundle.js',
    sourcemap: isDev,
    minify: !isDev,
    target: 'es2022',
    external: ['/public/*'],
    plugins: [
      stylePlugin({
        postcss: {
          // plugins: [tailwindcss, autoprefixer, ...(process.env.NODE_ENV === 'production' ? [cssnano()] : [])],
          plugins: [autoprefixer, ...(process.env.NODE_ENV === 'production' ? [cssnano()] : [])],
        },
        renderOptions: {
          sassOptions: { loadPaths: ['./node_modules'], quietDeps: true },
        },
      }),
      manifestPlugin({ shortNames: true }),
    ],
  })
    .then((result) => {
      // Copy static files
      shelljs.cp('-R', './src/public', './dist')
      console.log(chalk.greenBright('[ESBuild: Client] Finished'))
    })
    .catch((e) => {
      process.exit(1)
    })
})
