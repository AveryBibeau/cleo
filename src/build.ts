import '##/config'
import { build, BuildOptions } from 'esbuild'
import { sassPlugin } from 'esbuild-sass-plugin'
import manifestPlugin from 'esbuild-plugin-manifest'
import { isDev } from '##/lib/util'

export const buildConfig: BuildOptions = {
  entryPoints: ['./src/client/main.ts'],
  bundle: true,
  outfile: './dist/public/bundle.js',
  sourcemap: isDev,
  minify: !isDev,
  target: 'esnext',
  plugins: [sassPlugin(), manifestPlugin({ shortNames: true })],
}

if (!isDev) {
  build(buildConfig).catch((e) => {
    process.exit(1)
  })
}
