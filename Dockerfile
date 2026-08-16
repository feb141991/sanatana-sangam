# ── Stage 1: Base & Dependencies ──────────────────────────────────────────────
FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package manifests for workspace caching
COPY package.json package-lock.json ./
COPY packages/dharma-rules/package.json ./packages/dharma-rules/
COPY packages/panchang-engine/package.json ./packages/panchang-engine/
COPY packages/pathshala-engine/package.json ./packages/pathshala-engine/
COPY packages/sadhana-engine/package.json ./packages/sadhana-engine/

# Install dependencies (ignore-scripts prevents prebuild running before source files are copied)
RUN npm install --ignore-scripts

# ── Stage 2: Builder ──────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time env
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build workspaces and Next.js standalone application
RUN npm run build

# ── Stage 3: Runner (Production Cloud Run Image) ──────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets & prerender cache
COPY --from=builder /app/public ./public

# Copy standalone output from Next.js build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
