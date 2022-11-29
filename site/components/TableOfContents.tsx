import { FunctionComponent, VNode } from 'preact'
import { slugify } from '##/lib/util'
import { MDXContent } from 'mdx/types'

export const TableOfContents: FunctionComponent<{ content: MDXContent }> = ({ content, children }) => {
  let resolvedChildren = content({}) as VNode
  return (
    <>
      <nav>
        <ol className="border-slate-200 border-2 pl-10 list-decimal rounded-lg p-6">
          {(resolvedChildren.props.children as VNode[])
            // TODO: Create tree representation from headers
            .filter((child) => typeof child.type === 'string' && child.type === 'h2')
            .map((child) => {
              return (
                <li>
                  <a href={`#${slugify(child.props.children as string)}`}>{child.props.children}</a>
                </li>
              )
            })}
        </ol>
      </nav>
      {children}
    </>
  )
}
