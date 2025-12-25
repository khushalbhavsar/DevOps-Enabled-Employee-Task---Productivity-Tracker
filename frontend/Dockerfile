# ---------- Build stage ----------
FROM node:16-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (deterministic)
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Build React app
RUN npm run build


# ---------- Runtime stage ----------
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check (HTML check – correct for frontend)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost | grep -qi "<html" || exit 1

CMD ["nginx", "-g", "daemon off;"]
