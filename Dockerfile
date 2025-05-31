FROM node:18-alpine AS base

# Cài đặt ffmpeg
FROM base AS deps
RUN apk add --no-cache ffmpeg

# Cài đặt các dependencies
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build ứng dụng
FROM deps AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM deps AS runner
WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]