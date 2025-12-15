# Complete Development Setup Guide

## ✅ Your Current Setup is PERFECT!

You're running all three services correctly:

### Terminal 1 - Backend API
```bash
npm run dev
```
- **Port:** 8081
- **URL:** `http://localhost:8081`
- **Network:** `http://192.168.12.215:8081`
- **What it does:** Express server with API routes and WebSocket

### Terminal 2 - Frontend Web App
```bash
npx vite
```
- **Port:** 5173
- **URL:** `http://localhost:5173`
- **Network:** `http://192.168.12.215:5173`
- **What it does:** React web application (Vite dev server)

### Terminal 3 - Mobile App (Expo)
```bash
cd mobile && npm start
```
- **Port:** 8082
- **URL:** `exp://192.168.12.215:8082`
- **What it does:** Expo development server for React Native mobile app

---

## Port Summary

| Service | Port | Local URL | Network URL |
|---------|------|-----------|-------------|
| Backend API | 8081 | `http://localhost:8081` | `http://192.168.12.215:8081` |
| Frontend Web | 5173 | `http://localhost:5173` | `http://192.168.12.215:5173` |
| Mobile Expo | 8082 | `exp://localhost:8082` | `exp://192.168.12.215:8082` |

---

## How They Connect

### Web App → Backend API
- Web app (5173) makes API calls to backend (8081)
- Uses dynamic hostname detection (fixed earlier)
- Works on both localhost and network IP

### Mobile App → Backend API
- Mobile app connects to backend (8081) for API calls
- Should use network IP when on physical device
- Configured in `mobile/services/api.ts`

---

## Accessing from Mobile Device

### Web App (Browser)
- **URL:** `http://192.168.12.215:5173`
- Works in mobile browser
- Uses mobile-optimized unified header

### Mobile App (Native)
- **Scan QR code** from Expo dev server
- Or use Expo Go app with: `exp://192.168.12.215:8082`
- Native React Native app experience

---

## Quick Start Commands

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend Web
npx vite

# Terminal 3 - Mobile App
cd mobile && npm start
```

---

## Network Access

All three services should be accessible from mobile devices on the same Wi-Fi:

- ✅ Backend: Already configured to listen on `0.0.0.0:8081`
- ✅ Frontend: Updated Vite config to listen on `0.0.0.0:5173`
- ✅ Mobile: Expo automatically handles network access

---

## Troubleshooting

### Can't access from mobile?
1. **Check firewall** - Allow ports 5173, 8081, 8082
2. **Verify same Wi-Fi** - All devices on same network
3. **Check IP address** - Use `ifconfig` to verify your Mac's IP
4. **Restart servers** - After config changes

### Mobile app can't connect to API?
- Check `mobile/services/api.ts` for API URL configuration
- Should use network IP: `http://192.168.12.215:8081`
- Not `localhost` (doesn't work on mobile devices)

---

## Summary

Your setup is **100% correct**! 🎉

- ✅ Backend on 8081
- ✅ Frontend on 5173  
- ✅ Mobile on 8082
- ✅ All configured for network access
- ✅ API URL dynamically detects hostname

Keep doing what you're doing! Everything is set up perfectly.
