import fs from 'fs'
import path from 'path'
import { evaluate } from '@mdx-js/mdx'
import mdxPrism from 'mdx-prism'
import remarkGFM from 'remark-gfm'
import { Fragment, jsx, jsxs } from 'preact/jsx-runtime'
import { Header } from '##/components/Header'
import { ExternalLink } from '##/components/ExternalLink'
import { TableOfContents } from '##/components/TableOfContents'

const root = process.cwd()

export const get = createRequestHandler({
  async handler(req, res) {
    // Get the package.json from the @ordinal/cleo package
    const cleoPackage = JSON.parse(fs.readFileSync(path.resolve(root, '../packages/cleo/package.json')).toString())

    // Get the main docs content from the root README
    const cleoReadme = fs.readFileSync(path.resolve(root, '../README.md')).toString()
    const readmeDocs = cleoReadme
      .split('<!-- Begin site docs -->')[1]
      .split('<!-- End site docs -->')[0]
      .replace(/(```[A-Za-z]+) {/g, '$1{') // Collapse whitespace after code block language specifier to allow line highlighting

    const ReadmeContent = (
      await evaluate(readmeDocs, {
        Fragment,
        jsx,
        jsxs,
        rehypePlugins: [mdxPrism],
        remarkPlugins: [remarkGFM],
      })
    ).default

    return await res.render({
      component: () => (
        <>
          <figure class="flex-col mb-8 flex gap-x-4 items-center text-neutral-500">
            <img src="/enzo_mari_rabbit.jpg" width="400px" height="261px" class="flex-shrink w-[33%] mb-4"></img>

            <figcaption class="text-sm w-[50%] text-center">
              Mari, Enzo (1957). <em>Il Gioco delle Favole</em>. Available at:{' '}
              <ExternalLink href="https://www.enzomari.com/">https://www.enzomari.com/</ExternalLink>
            </figcaption>
          </figure>

          <div class="bg-yellow-100 p-4 rounded-xl mb-6">
            <h1 class="inline text-red-600 font-bold">Cleo</h1>
            <p class="inline">
              {' '}
              is a <ExternalLink href="https://github.com/vitejs/vite">Vite</ExternalLink> plugin for building server
              rendered websites with <ExternalLink href="https://github.com/fastify/fastify">Fastify</ExternalLink> and{' '}
              <ExternalLink href="https://github.com/preactjs/preact">Preact</ExternalLink>.
            </p>
          </div>

          <div class="flex gap-4 flex-wrap mb-6">
            <div class="font-bold">Version {cleoPackage.version} Alpha</div>
            <ExternalLink href="https://github.com/ordinal-studio/cleo">View on GitHub</ExternalLink>
          </div>

          <TableOfContents content={ReadmeContent}></TableOfContents>
          <div class="markdown">
            <ReadmeContent
              components={{
                h1: Header('h1') as any,
                h2: Header('h2') as any,
                h3: Header('h3') as any,
                h4: Header('h4') as any,
                h5: Header('h5') as any,
                h6: Header('h6') as any,
                a: ExternalLink as any,
              }}
            ></ReadmeContent>
          </div>
        </>
      ),
    })
  },
})
