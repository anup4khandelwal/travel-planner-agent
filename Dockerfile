FROM node:20-slim

WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copy source code
COPY src/ ./src/
COPY public/ ./public/

# Build TypeScript code
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
# Note: OLLAMA_BASE_URL will need to be set during deployment

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["node", "dist/index.js"]
