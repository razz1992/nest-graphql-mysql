# syntax=docker/dockerfile:1

##########################
# 1. Dependencies (cached)
##########################
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

##########################
# 2. Build
##########################
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev

##########################
# 3. Production runtime
##########################
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8085

# Stable non-root UID lets a file-backed Compose secret be readable by the app user.
RUN addgroup -S -g 10001 nodejs && adduser -S -u 10001 -G nodejs nestjs

COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --chown=nestjs:nodejs package.json ./
USER nestjs
EXPOSE 8085

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8085}/health || exit 1

CMD ["node", "dist/main"]
