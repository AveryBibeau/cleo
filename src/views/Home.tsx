import { FunctionComponent, h, Fragment } from 'preact'
import { getHref } from '##/lib/routeUtils'
import context from '##/lib/view/context'

type HomeProps = {
  foo?: string
}
export const Home: FunctionComponent<HomeProps> = ({ foo }) => {
  let { user } = context.session.get()
  
  return (
    <Fragment>
      <h1 class="mb-4">Home</h1>
      {foo && <h2>foo: {foo}</h2>}
      <a href={getHref({ name: 'Home' })}>Link to home</a>
    </Fragment>
  )
}
