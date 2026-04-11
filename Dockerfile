# ------------------------------------------------------------------------------
#  Sharptoolz Frontend – Production Dockerfile (Dokploy)
# ------------------------------------------------------------------------------

# -- Stage 1: Build --
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy project files
COPY . .

# Build Arguments for Vite
ARG VITE_PUBLIC_API_URL
ARG VITE_WS_URL

# Set Environment Variables for Build
ENV VITE_PUBLIC_API_URL=$VITE_PUBLIC_API_URL \
    VITE_WS_URL=$VITE_WS_URL

# Build the project
RUN pnpm build

# -- Stage 2: Serving --
FROM node:22-alpine

WORKDIR /app

# Install a simple static server
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port (Dokploy will map this via Traefik)
EXPOSE 3000

# Start serving the dist folder
# -s flag handles SPA routing (redirects all requests to index.html)
CMD ["serve", "-s", "dist", "-l", "3000"]
