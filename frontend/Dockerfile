FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with comprehensive conflict resolution
RUN npm install --legacy-peer-deps --no-fund && \
    npm install ajv-keywords@latest --save-dev --legacy-peer-deps && \
    npm install ajv@latest --save-dev --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN CI=false npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
