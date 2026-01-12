# --- STAGE 1: Frontend Build ---
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- STAGE 2: Backend Build ---
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# --- STAGE 3: Backend Production Dependencies ---
FROM node:22-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

# --- STAGE 4: Final Production Image ---
FROM node:22-alpine
LABEL maintainer="Rahul Parmar <rahul@parmar.ai>"

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001

# Copy backend package files
COPY backend/package*.json ./backend/

# Copy production node_modules from deps stage
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules

# Copy compiled backend code from builder stage
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy built frontend to public directory
COPY --from=frontend-builder /app/frontend/dist ./backend/public

# Security: Use non-root user
USER node

# Expose the application port
EXPOSE 5001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/ || exit 1

# Start the application using the compiled file
CMD ["node", "backend/dist/index.js"]

