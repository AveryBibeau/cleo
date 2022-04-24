import { HeadProps } from '##/lib/view/helmet.js'
import { require } from '##/lib/util'
import { readFile } from 'fs/promises'
const manifest = require('../public/manifest.json')

function generateHead(manifest: Record<string, any>): HeadProps {
  return {
    script: [
      {
        src: `/public/${manifest['main.ts']}`,
        defer: true,
      },
    ],
    link: [
      {
        href: `/public/${manifest['main.css']}`,
        rel: 'stylesheet',
      },
    ],
    meta: [
      {
        name: 'viewport',
        content: 'width=device-width,initial-scale=1',
      },
    ],
    title: 'JSX+SSR',
  }
}

export const defaultHead: HeadProps = generateHead(manifest)

export async function devHead(): Promise<HeadProps> {
  const freshManifest = JSON.parse((await readFile(new URL('../public/manifest.json', import.meta.url))).toString())
  return generateHead(freshManifest)
}
