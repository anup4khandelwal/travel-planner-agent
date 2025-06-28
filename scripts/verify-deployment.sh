#!/bin/bash

# Deployment Verification Script for Travel Planner Agent
echo "🔍 Travel Planner Agent - Deployment Verification"
echo "================================================="

# Check if URL is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <deployment-url>"
    echo "Example: $0 https://your-app.railway.app"
    exit 1
fi

DEPLOYMENT_URL=$1

echo "🌐 Testing deployment at: $DEPLOYMENT_URL"
echo ""

# Test 1: Health Check
echo "1️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health check passed (HTTP $HEALTH_RESPONSE)"
else
    echo "❌ Health check failed (HTTP $HEALTH_RESPONSE)"
fi

# Test 2: Web Interface
echo ""
echo "2️⃣ Testing web interface..."
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL")
if [ "$WEB_RESPONSE" = "200" ]; then
    echo "✅ Web interface accessible (HTTP $WEB_RESPONSE)"
else
    echo "❌ Web interface failed (HTTP $WEB_RESPONSE)"
fi

# Test 3: Chat API
echo ""
echo "3️⃣ Testing chat API..."
CHAT_RESPONSE=$(curl -s -X POST "$DEPLOYMENT_URL/api/chat" \
    -H "Content-Type: application/json" \
    -d '{"userId": "test", "message": "Hello"}' \
    -w "%{http_code}" -o /tmp/chat_response.json)

if [ "$CHAT_RESPONSE" = "200" ]; then
    echo "✅ Chat API responding (HTTP $CHAT_RESPONSE)"
    echo "📝 Response preview:"
    head -c 200 /tmp/chat_response.json
    echo ""
else
    echo "❌ Chat API failed (HTTP $CHAT_RESPONSE)"
fi

echo ""
echo "🎉 Deployment verification complete!"
echo ""
echo "📖 Next steps:"
echo "   • Test with a travel query: 'Find flights to Paris'"
echo "   • Check deployment logs if any tests failed"
echo "   • Verify environment variables are set correctly"
