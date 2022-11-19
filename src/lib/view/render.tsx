import { render } from 'preact-render-to-string'
import { h, ComponentType, FunctionComponent, ComponentChildren } from 'preact'
import { DefaultLayout, DefaultLayoutProps } from '../../layouts/default.js'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Helmet } from 'react-helmet'
import { CleoConfig, CleoConfigCtx } from '../../cleoConfig.js'

export interface SharedRenderRouteOptions<P = {}> {
  component: ComponentType<P>
  props?: P & { children?: ComponentChildren; addClass?: string }
}

// Layout options when using an unspecified layout that has no props
export interface RenderRouteOptionsDefault<P = {}> extends SharedRenderRouteOptions<P> {
  layout?: undefined
  layoutProps?: DefaultLayoutProps
}

// Layout options when using an unspecified layout that has props specified from declaration merging
export interface RenderRouteOptionsDefaultWithProps<P = {}> extends SharedRenderRouteOptions<P> {
  layout?: undefined
  layoutProps: DefaultLayoutProps
}

// Layout options when using a specified layout that has no props
export interface RenderRouteOptionsWithLayout<P = {}, L = {}> extends SharedRenderRouteOptions<P> {
  layout: ComponentType<L>
  layoutProps?: undefined
}

// Layout options when using a specified layout that has no props
export interface RenderRouteOptionsWithLayoutWithProps<P = {}, L = {}> extends SharedRenderRouteOptions<P> {
  layout: ComponentType<L>
  layoutProps: L
}

export type RenderRouteOptions<P = {}, L = {}> =
  | (keyof DefaultLayoutProps extends never ? RenderRouteOptionsDefault<P> : RenderRouteOptionsDefaultWithProps<P>)
  | (keyof L extends never ? RenderRouteOptionsWithLayout<P, L> : RenderRouteOptionsWithLayoutWithProps<P, L>)

export type RenderFragmentOptions<P = {}> = {
  component: ComponentType<P>
  props?: P & { children?: ComponentChildren; addClass?: string }
}

export async function renderRoute<P extends h.JSX.IntrinsicAttributes, L>(
  options: RenderRouteOptions<P, L>,
  request: FastifyRequest,
  reply: FastifyReply,
  template: string,
  cleoConfig: CleoConfig
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

  let layout = options?.layout === undefined ? defaultLayoutToUse : options.layout

  for (let renderRouteHook of cleoConfig?.hooks?.beforeRenderPage ?? []) {
    // @ts-ignore
    await renderRouteHook(request, reply, options)
  }

  return renderPage<P, L>(layout as ComponentType<L>, options.component, propsToUse, layoutPropsToUse as L, template)
}

export async function renderComponent<P extends h.JSX.IntrinsicAttributes>(
  options: RenderFragmentOptions<P>,
  request: FastifyRequest,
  cleoConfig: CleoConfig
) {
  const Component = options.component

  for (let renderRouteHook of cleoConfig?.hooks?.beforeRenderPage ?? []) {
    // @ts-ignore
    await renderRouteHook(request, reply, options)
  }

  return render(<Component {...(options.props ?? ({} as P))}></Component>)
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
