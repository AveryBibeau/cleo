declare type Nullable<T> = T | null
declare type Maybe<T> = T | undefined

declare type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

declare type JSONValue = null | boolean | number | string | JSONObject | JSONArray
declare type JSONObject = {
  [k: string]: JSONValue
}
declare type JSONArray = JSONValue[]
