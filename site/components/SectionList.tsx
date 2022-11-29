import { Component, FunctionComponent, toChildArray, VNode } from 'preact'
import { Section, SectionProps } from '##/components/Section'
import { slugify } from '##/lib/util'

type SectionListProps = {}

export const SectionList: FunctionComponent<SectionListProps> = ({
  children,
}) => {
  const sectionItems = toChildArray(children) as VNode<SectionProps>[]
  return (
    <>
      <nav>
        <ol className="border-slate-200 border-2 pl-10 list-decimal rounded-lg p-6">
          {sectionItems.map((child) => {
            return (
              <li>
                <a href={`#${slugify(child.props.title)}`}>
                  {child.props.title}
                </a>
              </li>
            )
          })}
        </ol>
      </nav>
      {children}
    </>
  )
}
