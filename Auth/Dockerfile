FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies in a separate layer
FROM base AS deps
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
# Use npm by default; ignore if lockfile not present
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Build TypeScript
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY package.json ./
COPY src ./src
RUN npm run build

# Production image
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 4003
CMD ["node", "dist/index.js"]
