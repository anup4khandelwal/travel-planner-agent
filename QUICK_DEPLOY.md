# 🚀 Quick Deployment Guide

## Option 1: Railway (Easiest - No CLI needed)

### Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Make sure all files are committed

### Step 2: Deploy via Railway Web Interface
1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `travel-agent` repository
5. Railway will automatically detect it's a Node.js app
6. **Important**: Railway will use Nixpacks (not Docker) by default, which works better for Node.js apps

### Step 3: Set Environment Variables
In Railway dashboard → Variables tab, add:
```
NODE_ENV=production
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key-here
LLM_MODEL=gpt-3.5-turbo
```

### Step 4: Deploy
- Railway will automatically build and deploy
- Your app will be live at: `https://your-app-name.railway.app`

---

## Option 2: Vercel (Serverless)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
cd /path/to/your/travel-agent
vercel --prod
```

### Step 3: Set Environment Variables
```bash
vercel env add NODE_ENV production
vercel env add LLM_PROVIDER openai
vercel env add OPENAI_API_KEY sk-your-key-here
vercel env add LLM_MODEL gpt-3.5-turbo
```

---

## Option 3: Render (Free Tier Available)

### Step 1: Go to Render
1. Visit [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Use these settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 20

### Step 3: Environment Variables
Add in Render dashboard:
```
NODE_ENV=production
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key-here
LLM_MODEL=gpt-3.5-turbo
```

---

## 🔑 Getting OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up/login
3. Go to API Keys section
4. Click "Create new secret key"
5. Copy the key (starts with `sk-`)
6. **Important**: Add billing info (you get $5 free credit)

---

## 💰 Cost Breakdown

### Railway
- **Hobby Plan**: $5/month
- **OpenAI API**: ~$3-10/month
- **Total**: ~$8-15/month

### Vercel
- **Hobby Plan**: Free (with limits)
- **Pro Plan**: $20/month (if you exceed limits)
- **OpenAI API**: ~$3-10/month

### Render
- **Free Tier**: $0/month (with limitations)
- **Starter Plan**: $7/month
- **OpenAI API**: ~$3-10/month

---

## 🧪 Testing Your Deployment

Once deployed, test these endpoints:

1. **Health Check**: `https://your-app.com/health`
2. **Chat API**: 
   ```bash
   curl -X POST https://your-app.com/api/chat \
     -H "Content-Type: application/json" \
     -d '{"userId": "test", "message": "Find flights to Paris"}'
   ```
3. **Web Interface**: `https://your-app.com`

---

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**: 
   - Check if all dependencies are in `package.json`
   - Ensure Node.js version is 18+
   - **Railway**: Use Nixpacks instead of Docker (default)

2. **Docker Build Issues**:
   - TypeScript compilation errors: Make sure `tsconfig.json` is included
   - Dependency issues: Use `npm install` instead of `npm ci` in Dockerfile
   - **Recommendation**: Use Railway's Nixpacks (automatic) instead of Docker

3. **App Crashes**:
   - Check environment variables are set correctly
   - Verify OpenAI API key is valid
   - Check deployment logs for specific errors

4. **CORS Errors**:
   - Your deployment domain should be automatically allowed
   - Check browser console for specific errors

5. **LLM Not Responding**:
   - Verify `OPENAI_API_KEY` is set correctly
   - Check OpenAI account has billing enabled
   - Test with a simple message first

---

## 🎉 You're Live!

Your travel agent is now accessible worldwide! Share the URL with others to try your AI travel planner.

**Next Steps:**
- Monitor usage in your deployment platform dashboard
- Check OpenAI usage in their dashboard
- Consider adding rate limiting for production use
