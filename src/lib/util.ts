import { dirname } from 'path'
import { fileURLToPath } from 'url'

const rootDir = import.meta.url

export const __dirname = dirname(fileURLToPath(rootDir))

export const isDev = process.env.NODE_ENV === 'development'
