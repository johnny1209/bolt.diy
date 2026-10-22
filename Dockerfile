# Shared Node and pnpm setup
FROM node:22-bookworm-slim AS base
WORKDIR /app

ENV HUSKY=0 \
    CI=true

RUN corepack enable \
    && corepack prepare pnpm@9.15.9 --activate \
    && apt-get update \
    && apt-get install -y --no-install-recommends git curl \
    && rm -rf /var/lib/apt/lists/*

ARG VITE_PUBLIC_APP_URL
ENV VITE_PUBLIC_APP_URL=${VITE_PUBLIC_APP_URL}

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

# Production image: keep Vite installed because dockerstart runs `vite preview`.
FROM base AS bolt-ai-production
ENV NODE_ENV=production \
    PORT=5173 \
    HOST=0.0.0.0 \
    WRANGLER_SEND_METRICS=false \
    RUNNING_IN_DOCKER=true

ARG VITE_LOG_LEVEL=debug
ARG DEFAULT_NUM_CTX
ENV VITE_LOG_LEVEL=${VITE_LOG_LEVEL} \
    DEFAULT_NUM_CTX=${DEFAULT_NUM_CTX}

RUN NODE_OPTIONS=--max-old-space-size=4096 pnpm run build \
    && test -x /app/node_modules/.bin/vite \
    && pnpm exec vite --version

RUN mkdir -p /root/.config/.wrangler \
    && echo '{"enabled":false}' > /root/.config/.wrangler/metrics.json

EXPOSE 5173
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
    CMD curl -fsS http://localhost:5173/ || exit 1
CMD ["pnpm", "run", "dockerstart"]

# Development image
FROM base AS development
ARG VITE_LOG_LEVEL=debug
ARG DEFAULT_NUM_CTX
ENV VITE_LOG_LEVEL=${VITE_LOG_LEVEL} \
    DEFAULT_NUM_CTX=${DEFAULT_NUM_CTX} \
    RUNNING_IN_DOCKER=true
CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]
