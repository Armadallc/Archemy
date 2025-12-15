# Mobile Login Fix - Network API Access

## Problem
When accessing the app from a mobile device using `http://192.168.12.215:5173`, the login wasn't working because API calls were hardcoded to `http://localhost:8081`, which doesn't work from mobile devices.

## Solution
Updated the API base URL to dynamically detect the current hostname:

### Files Updated:
1. **`client/src/lib/queryClient.ts`** - Main API request function
2. **`client/src/hooks/useAuth.tsx`** - Authentication API calls
3. **`client/src/hooks/useWebSocket.tsx`** - WebSocket connections

### How It Works:
- If accessing from `localhost` or `127.0.0.1` → Uses `http://localhost:8081`
- If accessing from network IP (e.g., `192.168.12.215`) → Uses `http://192.168.12.215:8081`

### Testing:
1. **On Mac (localhost):**
   - Access: `http://localhost:5173`
   - API calls go to: `http://localhost:8081` ✅

2. **On Mobile Device:**
   - Access: `http://192.168.12.215:5173`
   - API calls go to: `http://192.168.12.215:8081` ✅

## Next Steps:
1. **Restart the dev server** to pick up the changes
2. **Test login** from mobile device with:
   - `admin@monarch.com` / password
   - `driver@monarch.com` / password

## Environment Variable Override:
You can still override with `VITE_API_URL` in `.env` if needed:
```
VITE_API_URL=http://192.168.12.215:8081
```

But the dynamic detection should work automatically now!
