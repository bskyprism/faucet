# Stage 1: Get Tap binary from official image
FROM ghcr.io/bluesky-social/indigo/tap:latest AS tap

# Stage 2: Build the combined container (Alpine to match tap binary)
FROM node:20-alpine

# Install supervisord and native build deps for better-sqlite3
RUN apk add --no-cache supervisor python3 make g++

# Copy tap binary from official image
COPY --from=tap /tap /tap

# Setup app
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src/ ./src/
COPY ascii2.txt ./

# Supervisord config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose both ports
EXPOSE 2480 8080

# Data volume
VOLUME /data

# Run supervisord to manage both processes
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
