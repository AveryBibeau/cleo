declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production'
      PORT: string
      SESSION_SECRET: string
    }
  }
}

export {}
