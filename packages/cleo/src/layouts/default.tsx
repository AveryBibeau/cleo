import { h, Fragment, FunctionComponent } from 'preact'

export interface DefaultLayoutProps {}

export const DefaultLayout: FunctionComponent<DefaultLayoutProps> = ({ children }) => {
  return <Fragment>{children}</Fragment>
}
