# Accessing Development Server from Mobile Device

## Problem

When trying to access `http://localhost:8082` from a mobile device browser, it doesn't work because `localhost` on a mobile device refers to the device itself, not your development machine.

## Solution: Use Your Local Network IP Address

### Step 1: Find Your Development Machine's IP Address

**On macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Or:
```bash
ipconfig getifaddr en0  # macOS (WiFi)
ipconfig getifaddr en1  # macOS (Ethernet)
```

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Common IP ranges:**
- `192.168.x.x` (most home networks)
- `10.0.x.x` (some networks)
- `172.16.x.x` - `172.31.x.x` (some corporate networks)

### Step 2: Start Expo with Network Access

Make sure Expo is started with network access enabled:

```bash
cd mobile
npx expo start --web --port 8082 --host tunnel
```

Or use the `--lan` flag:
```bash
npx expo start --web --port 8082 --lan
```

### Step 3: Access from Mobile Device

**Use your local IP address instead of localhost:**

```
http://YOUR_IP_ADDRESS:8082
```

**Example:**
```
http://192.168.1.100:8082
```

### Step 4: Correct Routes

Expo Router uses file-based routing. The correct routes are:

- ✅ `http://YOUR_IP:8082/` - Root (redirects to login or dashboard)
- ✅ `http://YOUR_IP:8082/(auth)/login` - Login page
- ❌ `http://YOUR_IP:8082/login` - **Does NOT exist** (file-based routing)

## Alternative: Use Expo Tunnel

If you're having network issues, use Expo's tunnel feature:

```bash
cd mobile
npx expo start --web --tunnel
```

This creates a public URL that works from anywhere (but may be slower).

## Quick Reference

### Find IP Address (macOS)
```bash
# WiFi
ipconfig getifaddr en0

# Ethernet
ipconfig getifaddr en1

# All interfaces
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Start Expo with Network Access
```bash
cd mobile
npx expo start --web --port 8082 --lan
```

### Access from Mobile
```
http://YOUR_IP_ADDRESS:8082
```

## Troubleshooting

### "Connection Refused" Error

1. **Check firewall**: Make sure port 8082 is not blocked
2. **Check network**: Ensure mobile device is on the same WiFi network
3. **Try tunnel mode**: Use `--tunnel` flag instead of `--lan`

### "Cannot Connect" Error

1. **Verify IP address**: Make sure you're using the correct IP
2. **Check Expo output**: Look for the network URL in Expo CLI
3. **Try different network**: Some networks block device-to-device communication

### Routes Not Working

- Use `/(auth)/login` not `/login`
- Use `/(tabs)/dashboard` not `/dashboard`
- Root path `/` will auto-redirect based on auth status

## Security Note

⚠️ **Development Only**: Using `--lan` or `--tunnel` exposes your dev server to your local network (or internet with tunnel). Only use this for development, not production.



