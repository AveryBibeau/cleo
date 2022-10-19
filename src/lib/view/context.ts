/**
 * This context can be imported and used from components. It is set after all
 * async data fetching has finished, and immediately before the view is
 * synchronously rendered. Its properties are nulled when rendering is complete.
 */

export interface Session {}

export type PageData = {
  url: URL
  params: Record<string, any>
}

export type Stuff = Record<string, any>

let session: Session
let page: PageData
let stuff: Stuff

export default {
  session: {
    set(val: Session) {
      session = val
    },
    get(): Session {
      if (session) return session
      else throw new Error(`Expected context.session to be defined`)
    },
  },
  page: {
    set(val: PageData) {
      page = val
    },
    get(): PageData {
      if (page) return page
      else throw new Error(`Expected context.page to be defined`)
    },
  },
  stuff: {
    set(val: Stuff) {
      stuff = val
    },
    get(): Stuff {
      if (stuff) return stuff
      else throw new Error(`Expected context.stuff to be defined`)
    },
  },
}
