# Stage 1: Install dependencies
FROM node:18-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
# Automatically leverage Docker cache to reinstall dependencies only when package files change.
COPY package.json package-lock.json* ./
# Use 'npm ci' for faster, more reliable installs from lock file
# Added --legacy-peer-deps flag as requested
RUN npm ci --legacy-peer-deps

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application code
COPY . .

# Set NODE_ENV to production for build optimizations
ENV NODE_ENV production

# Build the Next.js application
RUN npm run build
# If you have Prisma, uncomment and adjust the following line:
# RUN npx prisma generate

# Stage 3: Production image, copy build artifacts and run
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user 'node' with group 'node'
RUN addgroup --system --gid 1001 node
RUN adduser --system --uid 1001 node

# Copy the standalone build output (includes necessary node_modules)
COPY --from=builder --chown=node:node /app/.next/standalone ./
# Copy the static assets (needed by standalone server.js)
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
# Copy the public folder (if you have images etc.)
COPY --from=builder --chown=node:node /app/public ./public

# Set the user to the non-root user
USER node

EXPOSE 3000

ENV PORT 3000
# ENV HOSTNAME "0.0.0.0" # Usually not needed inside Docker

# Run the node server (server.js is created by output: 'standalone')
CMD ["node", "server.js"]
