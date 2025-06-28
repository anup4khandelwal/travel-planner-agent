# Travel Planner Agent - Deployment Guide

This guide covers deploying your Travel Planner Agent to various cloud platforms with LLM connectivity.

## Deployment Options

### Option 1: Railway (Recommended)

Railway provides easy deployment with built-in environment variable management.

#### Steps:

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up

2. **Install Railway CLI** (optional):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

3. **Deploy via GitHub**:
   - Connect your GitHub repository to Railway
   - Railway will automatically detect your Node.js app
   - Set environment variables (see below)

4. **Environment Variables** (set in Railway dashboard):
   ```
   NODE_ENV=production
   PORT=3001
   LLM_PROVIDER=openai
   LLM_MODEL=gpt-3.5-turbo
   OPENAI_API_KEY=your_openai_api_key_here
   ```

#### Alternative: Use Ollama with Railway
If you want to use Ollama, you'll need to:
- Set `LLM_PROVIDER=ollama`
- Set `OLLAMA_BASE_URL=https://your-ollama-instance.com`
- Deploy Ollama separately (see Ollama deployment section)

### Option 2: Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Set environment variables in Vercel dashboard

### Option 3: Netlify

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Netlify:
   - Drag and drop the `dist` folder to Netlify
   - Or connect your GitHub repository

## LLM Configuration Options

### Option A: OpenAI (Easiest)

Set these environment variables:
```
LLM_PROVIDER=openai
LLM_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=sk-your-key-here
```

**Cost**: ~$0.002 per 1K tokens (very affordable for most use cases)

### Option B: Ollama (Self-hosted)

#### Deploy Ollama to Railway:

1. Create a new Railway service
2. Use this Dockerfile for Ollama:
   ```dockerfile
   FROM ollama/ollama:latest
   
   # Install a model
   RUN ollama serve & sleep 5 && ollama pull gemma2:2b
   
   EXPOSE 11434
   CMD ["ollama", "serve"]
   ```

3. Set environment variables in your main app:
   ```
   LLM_PROVIDER=ollama
   LLM_MODEL=gemma2:2b
   OLLAMA_BASE_URL=https://your-ollama-service.railway.app
   ```

#### Alternative Ollama Hosting:
- **Hugging Face Spaces**: Deploy Ollama as a Space
- **Google Cloud Run**: Deploy containerized Ollama
- **AWS ECS**: Deploy Ollama container

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `3000` |
| `LLM_PROVIDER` | LLM provider (`ollama` or `openai`) | No | `ollama` |
| `LLM_MODEL` | Model name | No | `gemma2:2b` |
| `OLLAMA_BASE_URL` | Ollama server URL | Only if using Ollama | `http://localhost:11434` |
| `OPENAI_API_KEY` | OpenAI API key | Only if using OpenAI | - |

## Testing Your Deployment

1. **Health Check**: Visit `https://your-app.railway.app/health`
2. **Chat Interface**: Visit `https://your-app.railway.app`
3. **API Test**: 
   ```bash
   curl -X POST https://your-app.railway.app/api/chat \
     -H "Content-Type: application/json" \
     -d '{"userId": "test", "message": "Find flights to Paris"}'
   ```

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your deployment domain is added to CORS configuration
2. **LLM Connection**: Check environment variables and API keys
3. **Build Errors**: Ensure all dependencies are in `package.json`
4. **Port Issues**: Railway automatically assigns PORT, don't hardcode it

### Logs:
- **Railway**: Check logs in Railway dashboard
- **Vercel**: Use `vercel logs`
- **Local Testing**: Use `npm run dev`

## Cost Estimates

### OpenAI Option:
- **Light usage** (100 conversations/day): ~$3-5/month
- **Medium usage** (1000 conversations/day): ~$30-50/month

### Ollama Option:
- **Railway hosting**: ~$5-10/month for small instance
- **Self-hosted**: Free (your hardware costs)

## Security Notes

1. Never commit API keys to Git
2. Use environment variables for all secrets
3. Enable HTTPS in production (automatic with Railway/Vercel)
4. Consider rate limiting for production use

## Next Steps

1. Choose your deployment platform
2. Set up LLM provider (OpenAI recommended for simplicity)
3. Configure environment variables
4. Deploy and test
5. Monitor usage and costs

Need help? Check the logs and ensure all environment variables are set correctly!
