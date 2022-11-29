import { FunctionComponent } from 'preact'

import { DefaultLayoutProps } from '@ordinal/cleo'
declare module '@ordinal/cleo' {
  interface DefaultLayoutProps {}
}

const DefaultLayout: FunctionComponent<DefaultLayoutProps> = ({ children }) => {
  return (
    <div class="max-w-screen-md mx-auto px-6 py-12">
      <Helmet titleTemplate="Cleo - %s" defaultTitle="Cleo"></Helmet>
      {children}
    </div>
  )
}

export default DefaultLayout
