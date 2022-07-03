import { h, Fragment, FunctionComponent } from 'preact'
import { Header } from '##/components/Header'

export interface DefaultLayoutProps {
  userSavedThread?: boolean
}

export const DefaultLayout: FunctionComponent<DefaultLayoutProps> = ({ children }) => (
  <Fragment>
    <Header></Header>
    {children}
  </Fragment>
)
