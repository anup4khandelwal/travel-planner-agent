FROM node:20-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY tsconfig*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source files explicitly
COPY src ./src
COPY public ./public

# Debug: List files to verify they're copied
RUN echo "Files in /app:" && ls -la
RUN echo "Files in /app/src:" && ls -la src/
RUN echo "TypeScript files found:" && find src -name "*.ts" | head -5

# Build the application using production config
RUN npx tsc -p tsconfig.build.json

# Remove dev dependencies and clean up
RUN npm prune --production && \
    rm -rf src && \
    rm -rf node_modules/.cache

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
# Note: OLLAMA_BASE_URL will need to be set during deployment

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["node", "dist/index.js"]
