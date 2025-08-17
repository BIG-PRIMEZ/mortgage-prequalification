# Redis Session Store Setup

## Why Redis is Required

In production, the application needs a persistent session store to maintain user conversations across multiple requests. Without Redis, sessions are stored in memory and will be lost when:
- The server restarts
- Multiple server instances are running (load balancing)
- Serverless functions handle different requests

## Setting Up Redis on Render

1. **Create a Redis Instance on Render:**
   - Go to your Render dashboard
   - Click "New +" and select "Redis"
   - Choose a name (e.g., "mortgage-redis")
   - Select the free tier or paid plan
   - Click "Create Redis"

2. **Get the Redis Connection String:**
   - Once created, go to your Redis instance
   - Copy the "Internal Redis URL" (starts with `redis://`)

3. **Add Redis URL to Your Web Service:**
   - Go to your mortgage-backend web service on Render
   - Navigate to "Environment" tab
   - Add a new environment variable:
     - Key: `REDIS_URL`
     - Value: (paste the Internal Redis URL)
   - Click "Save Changes"

4. **Verify the Connection:**
   - After deploying, check the logs for:
     - "🔧 Configuring Redis session store..."
     - "✅ Redis connected successfully"

## Alternative: Using Upstash Redis (Free Tier)

If you prefer a managed Redis service with a generous free tier:

1. Sign up at https://upstash.com
2. Create a new Redis database
3. Copy the Redis URL from the dashboard
4. Add it as `REDIS_URL` environment variable on Render

## Testing Session Persistence

To verify sessions are working correctly:
1. Start a conversation with the chatbot
2. Provide some information (income, debts, etc.)
3. Refresh the page
4. Continue the conversation - it should remember your previous data

## Troubleshooting

If sessions are still resetting:
1. Check that `NODE_ENV=production` is set on Render
2. Verify the Redis URL is correct in environment variables
3. Check logs for Redis connection errors
4. Ensure cookies are enabled in your browser
5. Verify the frontend URL matches the backend's CORS settings