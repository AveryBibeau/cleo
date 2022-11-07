import { render } from 'preact-render-to-string'
import { h, ComponentType, FunctionComponent, ComponentChildren } from 'preact'
import { helmet, HeadProps } from './helmet.js'
import { DefaultLayout, DefaultLayoutProps } from '../../layouts/default.js'
import { FastifyReply, FastifyRequest } from 'fastify'

type SharedRenderRouteOptions<P = {}> = {
  component: ComponentType<P>
  props?: P & { children?: ComponentChildren; addClass?: string }
  head?: HeadProps
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
}

export async function renderRoute<P extends h.JSX.IntrinsicAttributes, L>(
  options: RenderRouteOptions<P, L>,
  request: FastifyRequest,
  reply: FastifyReply,
  template: string
) {
  let propsToUse = options.props ?? ({} as P)
  let layoutPropsToUse = options.layoutProps ?? ({} as L)

  let layout = options.layout === undefined ? DefaultLayout : options.layout

  return renderPage<P, L>(layout, options.component, propsToUse, layoutPropsToUse, options.head ?? {}, template)
}

export function renderComponent<P extends h.JSX.IntrinsicAttributes>(
  options: RenderFragmentOptions<P>,
  request: FastifyRequest
) {
  const Component = options.component
  const markup = render(<Component {...(options.props ?? ({} as P))}></Component>)

  return markup
}

function renderPage<P extends h.JSX.IntrinsicAttributes, L>(
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
