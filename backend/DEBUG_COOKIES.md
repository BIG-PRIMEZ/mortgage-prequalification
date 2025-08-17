# Debug Cookie Issues

## Test the Session Endpoint

1. Open your browser's Developer Tools (F12)
2. Go to the Network tab
3. Visit: `https://your-backend.onrender.com/chat/session`
4. Check:
   - Response Headers: Look for `Set-Cookie`
   - Request Headers: Look for `Cookie` on subsequent requests

## Browser Console Test

Run this in your browser console while on your frontend:

```javascript
// Test session endpoint
fetch('https://your-backend.onrender.com/chat/session', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(res => res.json())
.then(data => console.log('Session test:', data))
.catch(err => console.error('Error:', err));
```

## Check Cookie Settings

In Chrome DevTools:
1. Application → Cookies
2. Look for your backend domain
3. Check if `sessionId` cookie exists
4. Verify:
   - SameSite: None
   - Secure: ✓
   - HttpOnly: ✓

## Common Issues

1. **No Set-Cookie header**: Backend isn't sending cookies
2. **Cookie blocked**: Browser blocking third-party cookies
3. **Wrong domain**: Cookie set for different domain
4. **HTTP vs HTTPS**: Secure cookies only work on HTTPS

## Environment Variables to Check

On Render, ensure these are set:
- `NODE_ENV=production`
- `SESSION_SECRET=your-secret-key`
- `FRONTEND_URL=https://mortgage-prequalification.vercel.app`