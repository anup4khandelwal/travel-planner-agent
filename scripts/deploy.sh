#!/bin/bash

# Travel Planner Agent Deployment Script

echo "🚀 Travel Planner Agent Deployment"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Please fix tests before deploying."
    exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before deploying."
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "🌐 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Choose a deployment platform (Railway, Vercel, Netlify)"
echo "2. Set up environment variables:"
echo "   - LLM_PROVIDER=openai (or ollama)"
echo "   - OPENAI_API_KEY=your_key (if using OpenAI)"
echo "   - LLM_MODEL=gpt-3.5-turbo (or your preferred model)"
echo "3. Deploy using your platform's CLI or web interface"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
