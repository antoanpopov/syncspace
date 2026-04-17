FROM node:20-alpine

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json ./packages/db/
COPY apps/server/package.json ./apps/server/

# Install all dependencies (including devDeps for tsx + tsc)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/db ./packages/db
COPY apps/server ./apps/server

# Build packages/db → dist/
RUN pnpm --filter @syncspace/db build

# Build server → dist/
RUN pnpm --filter @syncspace/server build

WORKDIR /app/apps/server

EXPOSE 3001

CMD ["node", "dist/index.js"]
