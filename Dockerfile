# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (vite is needed at runtime for this app)
RUN npm ci

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/client/public ./client/public
COPY --from=builder /app/scripts ./scripts

# Expose port
EXPOSE 5000

# Set environment variable
ENV NODE_ENV=production

# Start script that runs migrations and then starts the app
CMD ["sh", "-c", "npx drizzle-kit push && node dist/index.js"]
