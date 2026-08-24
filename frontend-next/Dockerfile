# syntax=docker/dockerfile:1

# ──────────────────────────────────────────
# Stage 1: deps — install all dependencies
# (native build tools required for better-sqlite3)
# ──────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Native build deps for better-sqlite3
RUN apk add --no-cache python3 make g++

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Copy manifests only (cache-friendly layer)
COPY package.json pnpm-lock.yaml ./

# Install all deps; pnpm will rebuild native modules (better-sqlite3)
# for the current platform (linux/musl/arm64 or linux/musl/x64).
# --config.minimum-release-age=0 disables the "too new" safety check that
# fires in CI when packages in the lockfile were published within the last 24h.
RUN pnpm install --frozen-lockfile --config.minimum-release-age=0


# ──────────────────────────────────────────
# Stage 2: build — compile the Next.js app
# ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

# Bring in node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full source
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# DB_PATH / BETTER_AUTH_SECRET / RESEND_API_KEY are read at module-init time
# when Next.js collects route-handler page data during build. Supply
# placeholders so `next build` succeeds; the real values are injected at
# container runtime via compose `environment:`.
ENV DB_PATH=/app/data/build-placeholder.db
ENV BETTER_AUTH_SECRET=build-time-placeholder-not-used-in-prod-00000000
ENV APP_URL=http://localhost:3000
ENV RESEND_API_KEY=re_build_time_placeholder_not_used_in_prod
RUN mkdir -p /app/data

RUN pnpm build


# ──────────────────────────────────────────
# Stage 3: runner — minimal production image
# ──────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy standalone server output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets into the standalone tree where Next.js expects them
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# ── Native module fixup ────────────────────────────────────────────────────
# Next.js standalone tracing does NOT reliably re-include the better-sqlite3
# .node binary built for this platform. Explicitly copy the full module
# (binding.gyp references internals, so copy the whole package directory).
COPY --from=builder --chown=nextjs:nodejs \
     /app/node_modules/.pnpm/better-sqlite3@12.11.1/node_modules/better-sqlite3 \
     ./node_modules/better-sqlite3

# ── Persistent data directory ──────────────────────────────────────────────
# Volume mount point; pre-created with correct ownership for the mount.
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

EXPOSE 3000

USER nextjs

CMD ["node", "server.js"]
