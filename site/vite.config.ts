import { defineConfig } from 'vite'
import { cleo } from '@ordinal/cleo'
import mdx from '@mdx-js/rollup'
import mdxPrism from 'mdx-prism'

export default defineConfig(() => {
  return {
    plugins: [
      cleo({ prerender: true }),
      mdx({
        jsxImportSource: 'preact',
        rehypePlugins: [mdxPrism],
      }),
    ],
  }
})
