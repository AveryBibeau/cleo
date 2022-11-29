import { FunctionComponent } from 'preact'

export const ExternalLink: FunctionComponent<{ href: string }> = ({ children, href }) => {
  return (
    <a href={href} target="_blank" rel="noopener">
      {children}
    </a>
  )
}
