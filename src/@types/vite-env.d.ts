/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Use VITE_ prefix for env vars exposed to client
  // readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
