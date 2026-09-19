# syntax=docker/dockerfile:1

##########################
# 1. Dependencies (cached)
##########################
FROM node:22-alpine AS deps
WORKDIR /app

# Install both prod + dev deps here so we can build (nest build needs devDependencies)
COPY package.json package-lock.json ./
RUN npm ci

##########################
# 2. Build
##########################
FROM node:22-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Compiles src/ -> dist/ using tsconfig.build.json (see nest-cli.json)
RUN npm run build

# Drop dev dependencies, keep only what's needed to run
RUN npm prune --omit=dev

##########################
# 3. Production runtime
##########################
FROM node:22-alpine AS production
WORKDIR /app

# NOTE on config: main.ts loads .env.prod via dotenv when NODE_ENV=production,
# and app.module.ts also loads .env.local unconditionally right after. Neither
# file is baked into this image (see .dockerignore), which is intentional:
# dotenv.config() never overwrites a variable that's already set, so real env
# vars you inject below (-e / --env-file / compose `environment:`) always win.
# Don't rely on a committed .env file reaching the container.
ENV NODE_ENV=production
ENV PORT=8085

# Run as non-root
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --chown=nestjs:nodejs package.json ./

USER nestjs

EXPOSE 8085

# Uses the AppController's /health route
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-8085}/health || exit 1

# Matches package.json's "start:prod" script
CMD ["node", "dist/main"]
