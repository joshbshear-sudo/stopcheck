FROM node:20-alpine
WORKDIR /app
COPY api/package*.json ./
RUN npm ci
COPY api/ ./
EXPOSE 3000
CMD ["node", "src/server.js"]
