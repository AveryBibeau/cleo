import { v4 as uuid } from 'uuid'

export const fastifyOpts = {
  disableRequestLogging: true,
  ignoreTrailingSlash: true,
  ajv: {
    customOptions: {
      strict: 'log',
      keywords: ['kind', 'modifier'],
    },
  },
  genReqId() {
    return uuid()
  },
  logger: {
    redact: {
      paths: ['headers.authorization'],
      remove: false,
      censor: '[redacted]',
    },
    // transport: !isProd
    //   ?
    //   : undefined,
  },
}
