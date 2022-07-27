import render from 'preact-render-to-string'
import { h, ComponentType, FunctionComponent, ComponentChildren, createContext } from 'preact'
import { helmet, HeadProps } from '##/lib/view/helmet'
import { defaultHead } from '##/lib/defaults'
import { DefaultLayout, DefaultLayoutProps } from '##/layouts/default'
import { FastifyReply, FastifyRequest } from 'fastify'
import context from '##/lib/view/context'
import { Stuff } from '##/lib/view/context'
import { merge } from 'lodash-es'

type SharedRenderRouteOptions<P = {}> = {
  component: ComponentType<P>
  props?: P & { children?: ComponentChildren; addClass?: string }
  head?: HeadProps
  stuff?: Stuff
  presession?: boolean
}

export type RenderRouteOptionsDefault<P = {}> = SharedRenderRouteOptions<P> & {
  layout?: undefined
  layoutProps?: DefaultLayoutProps
}
export type RenderRouteOptionsWithLayout<P = {}, L = {}> = SharedRenderRouteOptions<P> & {
  layout: ComponentType<L>
  layoutProps?: L
}

export type RenderRouteOptions<P = {}, L = {}> = RenderRouteOptionsDefault<P> | RenderRouteOptionsWithLayout<P, L>

export type RenderFragmentOptions<P = {}> = {
  component: ComponentType<P>
  props?: P & { children?: ComponentChildren; addClass?: string }
  stuff?: Stuff
}

export async function renderRoute<P, L>(
  options: RenderRouteOptions<P, L>,
  request: FastifyRequest,
  reply: FastifyReply,
  template: string
) {
  let headProps = { ...defaultHead }
  if (options.head) headProps = merge(headProps, options.head)

  let propsToUse = options.props ?? ({} as P)
  let layoutPropsToUse = options.layoutProps ?? ({} as L)

  let layout = options.layout === undefined ? DefaultLayout : options.layout

  context.session.set(request.session ?? {})
  let url = new URL(process.env.ORIGIN + request.url)

  let csrfToken = undefined

  // Generate csrf token for user or for routes requiring a presession
  if (request.session.user || options.presession) {
    csrfToken = await reply.generateCsrf()
  }

  context.page.set({
    csrfToken,
    url,
    params: (request.params ?? {}) as Record<string, any>,
  })
  context.stuff.set(options.stuff ?? {})

  return renderPage<P, L>(layout, options.component, propsToUse, layoutPropsToUse, headProps, template)
}

export function renderComponent<P>(options: RenderFragmentOptions<P>, request: FastifyRequest) {
  context.session.set(request.session ?? {})
  let url = new URL(process.env.ORIGIN + request.url)
  context.page.set({
    url,
    params: (request.params ?? {}) as Record<string, any>,
  })
  context.stuff.set(options.stuff ?? {})

  const Component = options.component
  const markup = render(<Component {...(options.props ?? ({} as P))}></Component>)

  return markup
}

function renderPage<P, L>(
  layout: ComponentType<L> | FunctionComponent<DefaultLayoutProps>,
  page: ComponentType<P>,
  props: P,
  layoutProps: L | DefaultLayoutProps,
  head: HeadProps,
  template: string
) {
  const Layout = layout
  const Page = page
  const markup = render(
    <Layout {...(layoutProps as L)}>
      <Page {...props}></Page>
    </Layout>
  )
  const headTags = render(helmet(head))

  const html = template.replace(`<!--ssr-outlet-->`, markup).replace('<!--ssr-head-->', headTags ?? '')

  return html
}
