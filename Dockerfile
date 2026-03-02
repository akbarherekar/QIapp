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

# Generate Prisma client and build Next.js
RUN npx prisma generate && npx next build

# Prepare standalone output (static assets + public dir must be copied in)
RUN cp -r .next/static .next/standalone/.next/static
RUN cp -r public .next/standalone/public

ENV NODE_ENV=production
EXPOSE 3000

# standalone server reads PORT and HOSTNAME env vars
# next start does NOT work with output: "standalone" — must use node server.js
CMD ["sh", "-c", "npx prisma migrate deploy 2>&1 || true; cd .next/standalone && PORT=${PORT:-3000} HOSTNAME=0.0.0.0 exec node server.js"]
