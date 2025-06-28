FROM node:20-slim

WORKDIR /app

# Copy everything at once (simplest approach)
COPY . .

# Install dependencies
RUN npm install

# Ensure public directory exists (create if missing)
RUN mkdir -p public

# Debug: List files to verify they're copied
RUN echo "Files in /app:" && ls -la
RUN echo "Files in /app/src:" && (ls -la src/ || echo "src directory not found")
RUN echo "Files in /app/public:" && (ls -la public/ || echo "public directory not found")

# Build the application
RUN npm run build

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
