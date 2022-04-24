import render from 'preact-render-to-string'
import { h, ComponentType } from 'preact'
import { helmet, HeadProps } from '##/lib/view/helmet'
import { mergeDeep, isDev } from '##/lib/util'
import { defaultHead, devHead } from '##/lib/defaults'
import { DefaultLayout } from '##/layouts/default'

export type RenderRouteOptions<P = {}> = {
  component: ComponentType<P>
  head?: HeadProps
  layout?: ComponentType
  props?: P
}

export async function renderRoute<P = {}>(options: RenderRouteOptions<P>) {
  let headProps = isDev ? await devHead() : defaultHead
  if (options.head) headProps = mergeDeep(headProps, options.head)

  let propsToUse = options.props ?? ({} as P)

  let layout = options.layout ?? DefaultLayout

  return renderPage<P>(layout, options.component, propsToUse, headProps)
}

function renderPage<P>(layout: ComponentType, page: ComponentType<P>, props: P, head?: HeadProps) {
  const Layout = layout
  const Page = page
  const markup = render(
    <Layout>
      <Page {...props}></Page>
    </Layout>
  )
  const headTags = head && render(helmet(head))

  const html = `<!doctype html>
<html>
  <head>
    ${headTags}
  </head>
  <body>
    ${markup}
  </body>
</html>`

  return html
}
