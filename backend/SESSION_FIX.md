# Session Configuration Fix

## The Problem
Sessions are resetting between requests because cookies aren't being sent (`Cookie header: undefined`).

## The Solution
We now use PostgreSQL for session storage (which Render provides for free) with proper CORS configuration.

## Environment Variables Required on Render

Add these to your backend service:

1. **DATABASE_URL** - Already provided by Render when you have a PostgreSQL database
2. **SESSION_SECRET** - A secure random string (e.g., `my-super-secret-key-123`)
3. **NODE_ENV** - Set to `production`
4. **FRONTEND_URL** - Your Vercel frontend URL (e.g., `https://your-app.vercel.app`)

## How It Works

The backend now automatically:
1. Detects PostgreSQL via DATABASE_URL
2. Creates a session table if needed
3. Stores sessions in the database
4. Sessions persist across deployments and server restarts

## Session Storage Priority

1. **Production**: PostgreSQL → Redis → File-based
2. **Development**: Persistent in-memory store

## Verify It's Working

After deployment, check logs for:
- `🐘 Configuring PostgreSQL session store...`
- `✅ PostgreSQL connected successfully`
- `✅ PostgreSQL session store configured`

Then test:
1. Send a message
2. Check that Session ID stays the same
3. Cookie header should show the sessionId cookie
4. Sessions persist across page refreshes

## Troubleshooting

If cookies still aren't being sent:
1. Check browser DevTools → Network → Request Headers for Cookie
2. Check Application → Cookies for sessionId cookie
3. Ensure frontend and backend are both HTTPS in production
4. Try clearing browser cookies and testing again