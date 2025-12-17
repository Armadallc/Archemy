# Accessing HALCYON on Web and Mobile Devices

## 🌐 Web Browser Access

### Local Access (Same Computer)
- **URL:** `http://localhost:5173`
- Open in any browser on your Mac

### Network Access (Other Computers on Same Network)
- **URL:** `http://192.168.12.215:5173`
- Use this from any device on the same Wi-Fi network

---

## 📱 Mobile Device Access

### Prerequisites
1. **Same Wi-Fi Network**: Your mobile device must be on the same Wi-Fi network as your Mac
2. **Firewall**: Make sure your Mac's firewall allows connections on port 5173

### Access from Mobile Browser

1. **Find your Mac's IP address** (already found): `192.168.12.215`

2. **On your mobile device:**
   - Open Safari (iOS) or Chrome (Android)
   - Navigate to: `http://192.168.12.215:5173`
   - The app should load!

### Troubleshooting Mobile Access

**If you can't connect:**

1. **Check Firewall Settings:**
   ```bash
   # Allow incoming connections on port 5173
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
   ```

2. **Verify Network:**
   - Make sure mobile device and Mac are on the same Wi-Fi
   - Try pinging from mobile: `ping 192.168.12.215`

3. **Check Vite Config:**
   - Should have `host: '0.0.0.0'` (already updated)
   - Restart dev server after config changes

4. **Alternative: Use ngrok (for external access):**
   ```bash
   npx ngrok http 5173
   ```
   This creates a public URL you can access from anywhere.

---

## 🔄 Restart Dev Server

After updating `vite.config.ts`, restart the dev server:

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

You should see:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: http://192.168.12.215:5173/
```

The "Network" URL is what you use on mobile devices!

---

## 📱 Testing Mobile Responsiveness

Once connected on mobile:

1. **Test Unified Header Mobile:**
   - Should see compact mobile header (64px height)
   - Logo/app name on left
   - Search and notifications on right
   - Scope selector visible on larger mobile screens (sm+)

2. **Test Navigation:**
   - Mobile bottom nav should work
   - Route transitions should be smooth
   - No horizontal scrolling

3. **Test Touch Targets:**
   - All buttons should be easy to tap (min 44px)
   - No overlapping elements

---

## 🚀 Quick Start

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **On your Mac browser:**
   - Go to: `http://localhost:5173`

3. **On your mobile device:**
   - Go to: `http://192.168.12.215:5173`
   - Make sure you're on the same Wi-Fi!

---

## 🔍 Verify Network Access

After restarting, check the terminal output. You should see:
```
➜  Network: http://192.168.12.215:5173/
```

If you only see "Local", the network access isn't enabled yet.

---

**Your Local IP:** `192.168.12.215`  
**Web Port:** `5173`  
**API Port:** `8081`




