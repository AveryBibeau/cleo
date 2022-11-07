export interface CleoConfig {
  generate?:
    | boolean
    | {
        addPaths?: () => Promise<string[]> | string[]
      }
}
