# Setting Up HTTPS for Development

## Problem
Mobile Safari blocks geolocation access over HTTP connections. You need HTTPS to test location tracking on mobile devices.

## Solution: Use mkcert for Local SSL Certificates

`mkcert` is a simple tool for making locally-trusted development certificates.

### Step 1: Install mkcert

**On macOS:**
```bash
brew install mkcert
```

**On Linux:**
```bash
# Ubuntu/Debian
sudo apt install libnss3-tools
wget -O mkcert https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-linux-amd64
chmod +x mkcert
sudo mv mkcert /usr/local/bin/

# Or use snap
sudo snap install mkcert
```

**On Windows:**
```powershell
# Using Chocolatey
choco install mkcert

# Or download from: https://github.com/FiloSottile/mkcert/releases
```

### Step 2: Install Local CA

```bash
mkcert -install
```

This installs a local Certificate Authority (CA) that your system will trust.

### Step 3: Generate Certificates for Your IP

```bash
# Generate certificate for your local IP
mkcert 192.168.12.227 localhost 127.0.0.1

# This creates two files:
# - 192.168.12.227+2.pem (certificate)
# - 192.168.12.227+2-key.pem (private key)
```

### Step 4: Update Expo Web Server to Use HTTPS

Since you're using Expo for the mobile app, you need to configure it to use HTTPS.

**Option A: Use Expo's built-in HTTPS (if available)**

Check if Expo supports HTTPS directly. If not, use Option B.

**Option B: Use a Reverse Proxy (Recommended)**

Use `http-proxy-middleware` or `local-ssl-proxy` to add HTTPS:

```bash
npm install -g local-ssl-proxy
```

Then run:
```bash
# In one terminal, start Expo normally
npm run web

# In another terminal, start the SSL proxy
local-ssl-proxy --source 8443 --target 8082 --cert 192.168.12.227+2.pem --key 192.168.12.227+2-key.pem
```

Access your app at: `https://192.168.12.227:8443`

### Step 5: Update Backend Server to Use HTTPS

You'll also need to configure your Express server to use HTTPS.

**Update `server/index.ts` or your server file:**

```typescript
import https from 'https';
import fs from 'fs';

// Load certificates
const options = {
  key: fs.readFileSync('./192.168.12.227+2-key.pem'),
  cert: fs.readFileSync('./192.168.12.227+2.pem'),
};

// Create HTTPS server
const server = https.createServer(options, app);

server.listen(8081, '0.0.0.0', () => {
  console.log(`✅ HTTPS Server running on https://0.0.0.0:8081`);
});
```

**Update WebSocket to use WSS:**
```typescript
// Update WebSocket server to use HTTPS
const wss = new WebSocketServer({ server });
```

### Step 6: Update Mobile App Configuration

Update the API base URL and WebSocket URL to use HTTPS:

**In `mobile/services/api.ts` or similar:**
```typescript
const API_BASE_URL = __DEV__ 
  ? 'https://192.168.12.227:8081'  // HTTPS for development
  : 'https://your-production-domain.com';
```

**In `mobile/services/websocket.ts`:**
```typescript
const WS_URL = __DEV__
  ? 'wss://192.168.12.227:8081/ws'  // WSS for development
  : 'wss://your-production-domain.com/ws';
```

### Step 7: Trust the Certificate on iPhone

1. **On your Mac:**
   - Open Keychain Access
   - Find "mkcert" in "System" or "login" keychain
   - Export the certificate

2. **On your iPhone:**
   - Email the certificate to yourself
   - Open the email on iPhone
   - Tap the certificate attachment
   - Go to Settings → General → VPN & Device Management
   - Tap the certificate profile
   - Tap "Install"
   - Trust it in Settings → General → About → Certificate Trust Settings

### Alternative: Use ngrok (Easier but Slower)

If setting up local HTTPS is too complex, use ngrok:

```bash
# Install ngrok
brew install ngrok

# Start your server normally
npm run dev

# In another terminal, create HTTPS tunnel
ngrok http 8082

# ngrok will give you a URL like: https://abc123.ngrok.io
# Use this URL on your iPhone
```

**Pros:**
- Very easy to set up
- Automatically provides HTTPS
- Works immediately

**Cons:**
- Slower (traffic goes through ngrok servers)
- Free tier has limitations
- URL changes each time (unless you pay)

## Testing After Setup

1. **Access app via HTTPS:**
   - `https://192.168.12.227:8443` (or your ngrok URL)

2. **Check browser console:**
   - Should see: `📍 Location permission status after request: granted`
   - Should NOT see: `[blocked] Access to geolocation was blocked`

3. **Check backend logs:**
   - Should see: `📍 [Mobile API] Received location update:`

## Troubleshooting

### Certificate errors in browser
- Make sure you installed the local CA: `mkcert -install`
- Make sure you're accessing via the IP/domain in the certificate

### Still getting blocked
- Clear browser cache
- Make sure you're using `https://` not `http://`
- Check that the certificate matches the URL you're accessing

### Backend not accepting connections
- Make sure firewall allows HTTPS (port 8443 or 8081)
- Check that certificates are in the correct location
- Verify certificate files are readable

## Quick Start Script

Create a script to automate this:

```bash
#!/bin/bash
# setup-https.sh

# Generate certificates
mkcert 192.168.12.227 localhost 127.0.0.1

# Move certificates to project root
mv 192.168.12.227+2.pem ./server/cert.pem
mv 192.168.12.227+2-key.pem ./server/key.pem

echo "✅ Certificates generated and moved to ./server/"
echo "📝 Update your server to use these certificates"
```


