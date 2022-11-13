import { render } from 'preact-render-to-string'
import { h, ComponentType, FunctionComponent, ComponentChildren } from 'preact'
import { DefaultLayout, DefaultLayoutProps } from '../../layouts/default.js'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Helmet } from 'react-helmet'

type SharedRenderRouteOptions<P = {}> = {
  component: ComponentType<P>
  props?: P & { children?: ComponentChildren; addClass?: string }
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

  let defaultLayoutToUse = DefaultLayout
  try {
    // @ts-ignore
    let userDefaultLayout = await import('/layouts/default.tsx')
    if (userDefaultLayout.default) {
      defaultLayoutToUse = userDefaultLayout.default
    }
  } catch (e) {
    // Noop
  }

  let layout = options.layout === undefined ? defaultLayoutToUse : options.layout

  return renderPage<P, L>(layout as ComponentType<L>, options.component, propsToUse, layoutPropsToUse as L, template)
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
  layout: ComponentType<L>,
  page: ComponentType<P>,
  props: P,
  layoutProps: L,
  template: string
) {
  const Layout = layout
  const Page = page

  const markup = render(
    <Layout {...(layoutProps as L)}>
      <Page {...props}></Page>
    </Layout>
  )

  const headParts = Helmet.renderStatic()

  const headTags = `
  ${headParts.base.toString()}
  ${headParts.bodyAttributes.toString()}
  ${headParts.htmlAttributes.toString()}
  ${headParts.link.toString()}
  ${headParts.meta.toString()}
  ${headParts.noscript.toString()}
  ${headParts.script.toString()}
  ${headParts.style.toString()}
  ${headParts.title.toString()}
  `.replace(/data-react-helmet="true"/g, '')

  const html = template.replace(`<!--ssr-outlet-->`, markup).replace('<!--ssr-head-->', headTags ?? '')

  return html
}
