# --- STAGE 1: Frontend Build ---
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
# Install dependencies first for better caching
COPY frontend/package*.json ./
RUN npm ci
# Copy source and build
COPY frontend/ ./
# Allow passing VITE_API_URL if needed, otherwise defaults to relative /
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- STAGE 2: Backend Dependencies ---
FROM node:22-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

# --- STAGE 3: Final Production Image ---
FROM node:22-alpine
LABEL maintainer="Ellavox DevOps <devops@ellavox.ai>"

# Create app directory
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=5001

# Copy backend dependencies
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/package*.json ./backend/

# Copy backend source
COPY backend/src ./backend/src

# Copy built frontend to the expected static serving path
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Security: Use non-root user provided by node image
USER node

# Expose the application port
EXPOSE 5001

# Healthcheck to ensure the container is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/ || exit 1

# Start the application
CMD ["node", "backend/src/index.js"]

