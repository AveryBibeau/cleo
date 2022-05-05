/**
 * This context can be imported and used from components. It is set after all
 * async data fetching has finished, and immediately before the view is
 * synchronously rendered. Its properties are nulled when rendering is complete.
 */

export interface Session {
  // Used for @fastify/session
}

export interface Stuff {
  // K/V store for shared data specific to the current request
  [key: string]: unknown
}

export interface PageData {
  url: URL
  params: Record<string, any>
}

let session: Session | undefined
let page: PageData | undefined
let stuff: Stuff | undefined

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
