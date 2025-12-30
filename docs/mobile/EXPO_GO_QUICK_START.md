# Expo Go Quick Start - Final Touches Development

## Setup (One-Time)

### 1. Install Expo Go on Your iPhone

1. Open **App Store** on your iPhone
2. Search for **"Expo Go"**
3. Install the app (it's free)

### 2. Start Development Server

```bash
cd /Users/sefebrun/Projects/HALCYON/mobile
npm start
```

This will:
- Start Metro Bundler
- Show a QR code in the terminal
- Display a URL (like `exp://192.168.12.227:8082`)

## Connecting Your iPhone

### Method 1: Scan QR Code (Easiest)

1. Open **Expo Go** app on your iPhone
2. Tap **"Scan QR Code"**
3. Point camera at the QR code in your terminal
4. App will load automatically

### Method 2: Enter URL Manually

1. Open **Expo Go** app on your iPhone
2. Tap **"Enter URL manually"**
3. Type the URL shown in terminal (e.g., `exp://192.168.12.227:8082`)
4. Tap **"Connect"**

## Development Workflow

### Making Changes

1. **Edit code** in your editor
2. **Save file**
3. **App auto-reloads** in Expo Go (hot reload)
4. **See changes instantly**

### Testing Features

- ✅ All driver features work in Expo Go
- ✅ Location tracking (foreground)
- ✅ Trip management
- ✅ Dashboard
- ✅ Emergency button
- ✅ Profile
- ✅ Chat
- ✅ Notifications

### Limitations in Expo Go

- ⚠️ Background location may have limitations
- ⚠️ Some native modules may not work
- ⚠️ Push notifications may need native build

**Note:** For final touches, Expo Go is perfect! Background location will work better in the native build.

## Troubleshooting

### Can't Connect?

1. **Check same network:**
   - iPhone and Mac must be on same Wi-Fi
   - Or use tunnel mode: `npm start -- --tunnel`

2. **Try tunnel mode:**
   ```bash
   npm start -- --tunnel
   ```
   - Uses ngrok (slower but works from anywhere)
   - QR code will update

3. **Check firewall:**
   - Mac firewall may block connection
   - Allow Node.js in System Settings → Network → Firewall

### App Won't Load?

1. **Clear Expo Go cache:**
   - Shake device
   - Tap "Reload"
   - Or close and reopen Expo Go

2. **Restart dev server:**
   ```bash
   # Press Ctrl+C to stop
   npm start -- --clear
   ```

### Changes Not Showing?

1. **Force reload:**
   - Shake device in Expo Go
   - Tap "Reload"

2. **Clear cache:**
   ```bash
   npm start -- --clear
   ```

## Quick Commands

```bash
# Start development server
cd mobile
npm start

# Start with cleared cache
npm start -- --clear

# Start with tunnel (if not on same network)
npm start -- --tunnel

# Stop server
# Press Ctrl+C in terminal
```

## What to Work On

Now that you're set up, focus on:

1. **UI/UX Polish**
   - Test all screens
   - Check navigation flow
   - Verify styling consistency

2. **Feature Testing**
   - Test trip management
   - Test location tracking
   - Test emergency button
   - Test notifications

3. **iOS Optimizations**
   - Review web-specific code
   - Test iOS-specific features
   - Verify safe area handling

4. **Bug Fixes**
   - Fix any issues you find
   - Improve error handling
   - Polish user experience

## Next Steps

1. ✅ Start dev server: `npm start`
2. ✅ Connect iPhone via Expo Go
3. ✅ Start making final touches
4. ✅ Test everything thoroughly
5. ⏳ Build when ready: `npm run eas:build:ios:preview`

## Tips

- **Keep Expo Go open** while developing
- **Shake device** to access developer menu
- **Reload** if app seems stuck
- **Test on real device** - better than simulator for location
- **Iterate quickly** - changes appear instantly


