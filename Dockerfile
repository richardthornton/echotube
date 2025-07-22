# EchoTube Dockerfile - Multi-stage build with security hardening
# Based on Alpine Linux for minimal attack surface

# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S echotube && \
    adduser -S echotube -u 1001 -G echotube

# Install security updates
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy dependencies from builder stage
COPY --from=builder --chown=echotube:echotube /app/node_modules ./node_modules

# Copy application source
COPY --chown=echotube:echotube src/ ./src/
COPY --chown=echotube:echotube package*.json ./

# Create cache directory with proper permissions
RUN mkdir -p /app/cache && chown echotube:echotube /app/cache

# Switch to non-root user
USER echotube

# Add health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1

# Set environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS="--enable-source-maps" \
    ET_CACHE_FILE=/app/cache/videos.json

# Expose port for potential health endpoint (not used currently)
EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/index.js"]

# Metadata labels
LABEL org.opencontainers.image.title="EchoTube" \
      org.opencontainers.image.description="YouTube RSS monitor with Discord webhook notifications" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.author="Richard Thornton" \
      org.opencontainers.image.source="https://github.com/richardthornton/echotube" \
      org.opencontainers.image.documentation="https://github.com/richardthornton/echotube/blob/main/README.md" \
      org.opencontainers.image.licenses="MIT"