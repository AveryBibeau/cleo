import { h, Fragment, FunctionComponent } from 'preact'
import { Header } from '##/components/Header'

export interface DefaultLayoutProps {
  test?: string
}

export const DefaultLayout: FunctionComponent = ({ children }) => (
  <Fragment>
    <Header></Header>
    {children}
  </Fragment>
)
