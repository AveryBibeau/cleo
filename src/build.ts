import '##/config'
import { build, BuildOptions } from 'esbuild'
import stylePlugin from 'esbuild-style-plugin'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
import manifestPlugin from 'esbuild-plugin-manifest'
import { isDev, __dirname } from '##/lib/util'

export const buildConfig: BuildOptions = {
  entryPoints: ['./src/client/main.ts'],
  bundle: true,
  outfile: './dist/public/bundle.js',
  sourcemap: isDev,
  minify: !isDev,
  target: 'esnext',
  external: ['/public/*'],
  plugins: [
    stylePlugin({
      postcss: {
        plugins: [tailwindcss, autoprefixer, ...(process.env.NODE_ENV === 'production' ? [cssnano()] : [])],
      },
      renderOptions: {
        sassOptions: { loadPaths: ['./node_modules'], quietDeps: true },
      },
    }),
    manifestPlugin({ shortNames: true }),
  ],
}

if (!isDev) {
  build(buildConfig).catch((e) => {
    process.exit(1)
  })
}
