import render from 'preact-render-to-string'
import { h, ComponentType } from 'preact'
import { helmet, HeadProps } from '##/lib/view/helmet'
import { mergeDeep } from '##/lib/util'

let DEFAULT_LAYOUT: ComponentType
let DEFAULT_HEAD: HeadProps

export type RenderRouteOptions<P = {}> = {
  component: ComponentType<P>
  head?: HeadProps
  layout?: ComponentType
  props?: P
}

export function renderRoute<P = {}>(options: RenderRouteOptions<P>) {
  let headProps = DEFAULT_HEAD
  if (options.head) headProps = mergeDeep(DEFAULT_HEAD, options.head)

  let propsToUse = options.props ?? ({} as P)

  let layout = options.layout ?? DEFAULT_LAYOUT

  return renderPage<P>(layout, options.component, propsToUse, headProps)
}

export function initializeRenderDefaults(defaultLayout: ComponentType, defaultHead: HeadProps) {
  DEFAULT_LAYOUT = defaultLayout
  DEFAULT_HEAD = defaultHead
}

function renderPage<P>(layout: ComponentType, page: ComponentType<P>, props: P, head?: HeadProps) {
  const App = layout
  const Page = page
  const markup = render(
    <App>
      <Page {...props}></Page>
    </App>
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
