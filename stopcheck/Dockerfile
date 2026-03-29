FROM node:22-slim

WORKDIR /app

# Install API dependencies
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev

# Copy API source
COPY api/ ./

# Start
CMD ["node", "src/server.js"]
