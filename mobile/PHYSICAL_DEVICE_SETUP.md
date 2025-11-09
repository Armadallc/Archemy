# Physical Device Setup Guide

## Issue: Login Not Working on Physical Device

When using a physical device (scanning QR code), the app can't connect to `localhost` because your phone and Mac are on different devices.

## Solution: Configure API URL

### Step 1: Find Your Mac's IP Address

Run this command in terminal:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```

Your IP is likely: **192.168.12.215**

### Step 2: Create `.env` File

Create a file at `mobile/.env` with:
```
EXPO_PUBLIC_API_URL=http://192.168.12.215:8081
```

**Note:** Replace `192.168.12.215` with your actual Mac IP if different.

### Step 3: Restart Expo

1. Stop the Expo server (Ctrl+C)
2. Restart it:
   ```bash
   cd mobile
   npx expo start --clear
   ```
3. Scan the QR code again on your physical device

### Step 4: Verify Backend is Running

Make sure your backend server is running:
```bash
# From project root
npm run dev
```

The server should be accessible at `http://192.168.12.215:8081`

### Step 5: Test Connection

On your physical device, the app should now connect to:
- `http://192.168.12.215:8081/api/auth/login`

## Troubleshooting

### Still can't connect?

1. **Check firewall**: Make sure your Mac's firewall allows connections on port 8081
2. **Same network**: Ensure your phone and Mac are on the same Wi-Fi network
3. **IP changed**: If your Mac's IP changed, update the `.env` file
4. **Backend not running**: Verify `npm run dev` is running and shows the server is listening

### Verify User Exists

The credentials should be:
- Email: `driver@monarch.com`
- Password: `driver123`

If login still fails, the user might not exist. Run:
```bash
node create-supabase-users.js
```

## Quick Fix Command

```bash
# Create .env file with your Mac's IP
echo "EXPO_PUBLIC_API_URL=http://192.168.12.215:8081" > mobile/.env

# Restart Expo
cd mobile
npx expo start --clear
```

