# Rebuild the source code
FROM node:16-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY . .
RUN pnpm check
RUN echo "tsc passed"
RUN NODE_ENV=production pnpm build

# Production image, copy all the files and run
FROM node:16-alpine AS runner
RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["npm", "run", "start"]