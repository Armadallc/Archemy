# Setting Up Multiple ngrok Tunnels (Free Tier)

## Problem

When accessing the app via HTTPS (ngrok), the browser blocks HTTP API calls to the backend (`http://192.168.12.227:8081`) due to mixed content security.

## Solution

Use ngrok config file to run multiple tunnels in a single agent session (free tier allows this).

## Step 1: Update ngrok Config File

Edit the ngrok config file:

```bash
# Open the config file
open ~/Library/Application\ Support/ngrok/ngrok.yml

# Or edit with nano/vim
nano ~/Library/Application\ Support/ngrok/ngrok.yml
```

Add this content:

```yaml
version: "3"
agent:
    authtoken: YOUR_AUTHTOKEN_HERE
tunnels:
  frontend:
    addr: 8082
    proto: http
  backend:
    addr: 8081
    proto: http
```

Replace `YOUR_AUTHTOKEN_HERE` with your actual authtoken (the one you used earlier).

## Step 2: Stop Current ngrok

Stop any running ngrok processes:
- Press `Ctrl+C` in the ngrok terminal
- Or: `lsof -ti:4040 | xargs kill`

## Step 3: Start All Tunnels

```bash
ngrok start --all
```

This will start both tunnels in a single agent session.

## Step 4: Get Both URLs

ngrok will show both URLs:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:8082
Forwarding   https://def456.ngrok-free.app -> http://localhost:8081
```

## Step 5: Update Mobile App Configuration

You need to tell the mobile app to use the ngrok backend URL.

**Option A: Environment Variable (Recommended)**

Create or update `mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=https://def456.ngrok-free.app
EXPO_PUBLIC_WS_URL=wss://def456.ngrok-free.app
```

Replace `def456.ngrok-free.app` with your actual backend ngrok URL.

**Option B: Update Code Directly**

Edit `mobile/services/api.ts` and `mobile/services/websocket.ts` to use the ngrok backend URL temporarily.

## Step 6: Restart Expo

After updating the environment variables:

```bash
cd mobile
npm run web
```

## Step 7: Access on iPhone

Use the **frontend** ngrok URL on your iPhone:
```
https://abc123.ngrok-free.app
```

The app will now make API calls to the **backend** ngrok URL (HTTPS), which will work!

## Notes

- **Free tier**: Allows multiple tunnels in one agent session (this is allowed!)
- **URLs change**: Each time you restart ngrok, you get new URLs
- **Update .env**: Remember to update `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` when URLs change


