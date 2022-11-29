import { slugify } from '##/lib/util'
import { FunctionComponent } from 'preact'

export const Header =
  (tag: string): FunctionComponent =>
  ({ children }) => {
    const HeaderTag = tag

    const childrenString = children?.toString()
    if (childrenString === undefined) throw new Error('Expected Header component to have children')
    const id = slugify(childrenString)

    return (
      // @ts-ignore
      <HeaderTag id={id} class="font-bold">
        <a
          href={`#${id}`}
          aria-label="Link to this section"
          class="inline-block w-8 -ml-4 -mr-4 no-underline !text-blue-200 hover:!text-blue-400"
        >
          §
        </a>
        {children}
      </HeaderTag>
    )
  }
