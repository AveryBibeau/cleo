import render from 'preact-render-to-string'
import { h, Fragment } from 'preact'
import Header from '../../components/Header.js'

const App = ({ children }: WithChildrenProp) => (
  <Fragment>
    <Header></Header>
    {children}
  </Fragment>
)

export function renderPage(page: h.JSX.Element) {
  const markup = render(<App>{page}</App>)

  const html = `<!doctype html>
<html>
  <head>
    <title>JSX SSR</title>
  </head>
  <body>
    ${markup}
  </body>
</html>`

  // Test stack trace
  if (Math.random() > 0.5) throw new Error('random error')

  return html
}
