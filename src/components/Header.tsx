import { getHref } from '##/lib/routeUtils'
import { FunctionComponent, h } from 'preact'

export const Header: FunctionComponent = () => {
  return (
    <header>
      <h1 class="mb-6">Website</h1>
      <a href={getHref({ name: 'Home' })}>Home</a>
    </header>
  )
}
