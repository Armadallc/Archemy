# Terminal Setup Commands for Location Tracking Testing

## Overview

You need 3 terminals running simultaneously:
1. **Backend Server** - API and WebSocket server
2. **Expo Web Server** - Mobile app frontend
3. **ngrok Tunnel** - HTTPS proxy for location services

## Terminal 1: Backend Server

**Location:** Project root (`/Users/sefebrun/Projects/HALCYON`)

```bash
cd /Users/sefebrun/Projects/HALCYON
npm run dev
```

**What it does:**
- Starts the Express backend server
- Runs on port 8081
- Handles API requests and WebSocket connections

**Keep this running** - Don't close this terminal

---

## Terminal 2: Expo Web Server (Mobile App)

**Location:** Mobile directory (`/Users/sefebrun/Projects/HALCYON/mobile`)

```bash
cd /Users/sefebrun/Projects/HALCYON/mobile
npm run web
```

**What it does:**
- Starts the Expo web development server
- Serves the mobile app as a PWA
- Usually runs on port 8082 (or 8083 if 8082 is busy)

**If prompted:**
- "Port 8082 is running this app in another window. Use port 8083 instead?"
- Answer **Y** (yes) to use 8083, or **N** to use 8082

**Keep this running** - Don't close this terminal

**Note the port number** - You'll need it for ngrok (Terminal 3)

---

## Terminal 3: ngrok Tunnel (HTTPS)

**Location:** Any directory (doesn't matter)

```bash
# If Expo is on port 8082:
ngrok http 8082

# OR if Expo is on port 8083:
ngrok http 8083
```

**What it does:**
- Creates an HTTPS tunnel to your Expo web server
- Provides a public HTTPS URL (e.g., `https://abc123.ngrok-free.app`)
- Required for location services (Safari blocks HTTP geolocation)

**Keep this running** - Don't close this terminal

**Copy the HTTPS URL** - Use this on your iPhone

**Example output:**
```
Forwarding   https://4877f7c5f01d.ngrok-free.app -> http://localhost:8082
```

---

## Quick Start Checklist

- [ ] **Terminal 1**: Backend server running (`npm run dev`)
- [ ] **Terminal 2**: Expo web server running (`npm run web`)
- [ ] **Terminal 3**: ngrok tunnel running (`ngrok http 8082` or `8083`)
- [ ] **Note**: Which port Expo is using (8082 or 8083)
- [ ] **Note**: ngrok HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

---

## Testing on iPhone

1. **Open Safari** on your iPhone
2. **Navigate to** the ngrok HTTPS URL (from Terminal 3)
3. **If you see ngrok warning page**: Click "Visit Site"
4. **Log in** to the app
5. **Check console** (via Safari Web Inspector) for location tracking logs

---

## Troubleshooting

### Backend not starting?
- Check if port 8081 is already in use
- Verify `npm run dev` works
- Check backend logs for errors

### Expo not starting?
- Check if port 8082/8083 is already in use
- Answer Y to use alternative port if prompted
- Verify `npm run web` works

### ngrok connection refused?
- Make sure Expo is running first (Terminal 2)
- Verify the port number matches (8082 or 8083)
- Check ngrok is pointing to the correct port

### Location still blocked?
- Make sure you're using the **HTTPS** URL (not HTTP)
- Check Safari console for permission errors
- Verify ngrok tunnel is active

---

## Stopping Everything

To stop all services:

1. **Terminal 1**: Press `Ctrl+C` (backend stops)
2. **Terminal 2**: Press `Ctrl+C` (Expo stops)
3. **Terminal 3**: Press `Ctrl+C` (ngrok stops)

---

## Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| Backend | 8081 | API and WebSocket server |
| Expo Web | 8082 or 8083 | Mobile app frontend |
| ngrok | 4040 | ngrok web interface (optional) |

---

## Environment Variables

Make sure your `.env` files are set up:

**Backend** (project root):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Mobile** (`mobile/.env`):
- `EXPO_PUBLIC_API_URL=http://192.168.12.227:8081` (or your Mac's IP)
- `EXPO_PUBLIC_WS_URL=ws://192.168.12.227:8081` (or your Mac's IP)


