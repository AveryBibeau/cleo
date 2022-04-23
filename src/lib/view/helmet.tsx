import { h, Fragment, VNode } from 'preact'

export type HeadProps = { title?: string } & {
  [key: string]: Record<string, any>[] | string
}

export function helmet(headProps: HeadProps) {
  let tags = Object.entries(headProps).reduce<VNode[]>((acc, [tagName, tags]) => {
    if (typeof tags === 'object') {
      let tagList = tags.map<VNode>((tagProps) => h(tagName, tagProps))
      return acc.concat(tagList)
    } else {
      return acc.concat([h(tagName, null, tags)])
    }
  }, [])
  return h(Fragment, null, ...tags)
}
