FROM node:22-slim AS base

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies (copy Prisma schema first — postinstall runs prisma generate)
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build Next.js (no DB needed)
RUN npx prisma generate && npx next build

ENV NODE_ENV=production
EXPOSE 3000

# Migrations may fail on first deploy (no DB yet) — don't block server start.
# Use -H 0.0.0.0 explicitly (HOSTNAME env var can conflict with Docker's container hostname).
# Railway injects PORT at runtime; default to 3000.
CMD ["sh", "-c", "npx prisma migrate deploy 2>&1 || echo 'Migration skipped'; exec npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
