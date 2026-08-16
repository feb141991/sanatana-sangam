# ── Stage 1: Base & Dependencies ──────────────────────────────────────────────
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root & package manifests
COPY package.json package-lock.json ./
COPY packages/dharma-rules/package.json ./packages/dharma-rules/
COPY packages/panchang-engine/package.json ./packages/panchang-engine/
COPY packages/pathshala-engine/package.json ./packages/pathshala-engine/
COPY packages/sadhana-engine/package.json ./packages/sadhana-engine/

# Install dependencies
RUN npm ci

# ── Stage 2: Builder ──────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time env
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build panchang-engine & application
RUN npm run build --workspace=@sangam/panchang-engine
RUN npm run build

# ── Stage 3: Runner (Production Cloud Run Image) ──────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone server output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
