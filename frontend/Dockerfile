# ============================================
# FRONTEND BUILD & DEPLOYMENT DOCKERFILE
# Multi-stage production-optimized build
# ============================================

# -------- Stage 1: Dependencies --------
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci --legacy-peer-deps --no-fund || npm install --legacy-peer-deps --force --no-fund


# -------- Stage 2: Builder --------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from stage 1
COPY --from=dependencies /app/node_modules /app/node_modules

# Copy source code
COPY . .

# Environment variables
ENV NODE_ENV=production
ENV CI=false

# Build React application
RUN npm run build

# Verify build output
RUN test -d /app/build || (echo "Build failed: /app/build not found" && exit 1)


# -------- Stage 3: Production --------
FROM nginx:alpine AS production

LABEL maintainer="DevOps Team" \
      description="Production-ready Employee Productivity Tracker Frontend"

WORKDIR /usr/share/nginx/html

# Install curl for health checks
RUN apk add --no-cache curl

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/*.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy optimized build artifacts
COPY --from=builder /app/build .

# Create nginx runtime directory
RUN mkdir -p /var/run/nginx

# Expose port
EXPOSE 3000 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/index.html || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
