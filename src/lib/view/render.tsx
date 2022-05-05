import render from 'preact-render-to-string'
import { h, ComponentType, FunctionComponent } from 'preact'
import { helmet, HeadProps } from '##/lib/view/helmet'
import { mergeDeep, isDev } from '##/lib/util'
import { defaultHead } from '##/lib/defaults'
import { DefaultLayout, DefaultLayoutProps } from '##/layouts/default'
import { FastifyRequest } from 'fastify'
import context, { Stuff } from '##/lib/context'

export type RenderRouteOptions<P = {}, L = {}> = {
  component: ComponentType<P>
  props?: P
  layout?: ComponentType<L>
  layoutProps?: L
  head?: HeadProps
  stuff?: Stuff
}

export type RenderFragmentOptions<P = {}> = {
  component: ComponentType<P>
  props: P
  stuff?: Stuff
}

export async function renderRoute<P, L = DefaultLayoutProps>(
  options: RenderRouteOptions<P, L>,
  request: FastifyRequest,
  template: string
) {
  let headProps = defaultHead
  if (options.head) headProps = mergeDeep(headProps, options.head)

  let propsToUse = options.props ?? ({} as P)
  let layoutPropsToUse = options.layoutProps ?? ({} as L)

  let layout = options.layout ?? DefaultLayout

  context.session.set(request.session ?? {})
  let url = new URL(request.headers.host + request.url)
  context.page.set({
    url,
    params: (request.params ?? {}) as Record<string, any>,
  })
  context.stuff.set(options.stuff ?? {})

  return renderPage<P, L>(layout, options.component, propsToUse, layoutPropsToUse, headProps, template)
}

export function renderComponent<P>(options: RenderFragmentOptions<P>, request: FastifyRequest) {
  context.session.set(request.session ?? {})
  let url = new URL(request.headers.host + request.url)
  context.page.set({
    url,
    params: (request.params ?? {}) as Record<string, any>,
  })
  context.stuff.set(options.stuff ?? {})

  const Component = options.component
  const markup = render(<Component {...options.props}></Component>)

  return markup
}

function renderPage<P, L>(
  layout: ComponentType<L> | FunctionComponent<DefaultLayoutProps>,
  page: ComponentType<P>,
  props: P,
  layoutProps: L,
  head: HeadProps,
  template: string
) {
  const Layout = layout
  const Page = page
  const markup = render(
    <Layout {...layoutProps}>
      <Page {...props}></Page>
    </Layout>
  )
  const headTags = render(helmet(head))

  const html = template.replace(`<!--ssr-outlet-->`, markup).replace('<!--ssr-head-->', headTags ?? '')

  return html
}
