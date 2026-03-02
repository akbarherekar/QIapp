FROM node:22-slim AS base

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build Next.js (no DB needed)
RUN npx prisma generate && npx next build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

# Run migrations at startup (DB available), then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
