#!/bin/bash
# Travel Planner Agent Deployment Script

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Travel Planner Agent Deployment ===${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Build the application
echo -e "${YELLOW}Building the application...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed. Please fix the errors and try again.${NC}"
    exit 1
fi

# Start Docker Compose
echo -e "${YELLOW}Starting Docker Compose services...${NC}"
docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}Docker Compose failed to start. Please check the logs.${NC}"
    exit 1
fi

# Pull the Gemma3 model
echo -e "${YELLOW}Pulling Gemma3 model (this may take a while)...${NC}"
docker-compose exec -T ollama ollama pull gemma3:latest
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to pull Gemma3 model. Please check Ollama logs.${NC}"
    echo -e "${YELLOW}Continuing anyway, but the application may not work correctly.${NC}"
fi

# Check if the application is running
echo -e "${YELLOW}Checking if the application is running...${NC}"
sleep 5
if curl -s http://localhost:3001/health | grep -q "healthy"; then
    echo -e "${GREEN}Travel Planner Agent is now running at http://localhost:3001${NC}"
    echo -e "${GREEN}Health check endpoint: http://localhost:3001/health${NC}"
    echo -e "${YELLOW}To stop the application, run: docker-compose down${NC}"
else
    echo -e "${RED}Application health check failed. Please check the logs:${NC}"
    echo -e "${YELLOW}docker-compose logs -f${NC}"
fi
