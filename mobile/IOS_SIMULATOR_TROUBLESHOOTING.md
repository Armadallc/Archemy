# iOS Simulator Troubleshooting Guide

## Quick Fixes

### 1. If Expo Go is stuck loading:

```bash
cd mobile

# Kill any stuck processes
pkill -f "expo\|metro"

# Clear all caches
rm -rf .expo node_modules/.cache
npx expo start --clear --ios
```

### 2. If you need to use Xcode directly (native build):

```bash
cd mobile

# Generate iOS native project
npx expo prebuild --platform ios

# Open in Xcode
open ios/*.xcworkspace

# Then build and run from Xcode (Cmd+R)
```

### 3. Common Issues and Solutions

#### Issue: Simulator opens but app never loads
**Solution:**
- Make sure Expo Go app is installed on simulator: Open Simulator → Device → Install App → Search for "Expo Go"
- Or use native build: `npx expo prebuild --platform ios`

#### Issue: Metro bundler won't start
**Solution:**
```bash
# Check if port 8081 is in use
lsof -ti:8081 | xargs kill -9

# Try different port
npx expo start --port 8082
```

#### Issue: "Unable to resolve module" errors
**Solution:**
```bash
cd mobile
rm -rf node_modules
npm install
npx expo start --clear
```

#### Issue: Simulator can't connect to Metro bundler
**Solution:**
- Check your Mac's firewall settings
- Try: `npx expo start --tunnel` (uses ngrok, slower but more reliable)
- Or: `npx expo start --lan` (uses local network)

### 4. Recommended Development Workflow

**For quick development (Expo Go):**
```bash
cd mobile
npx expo start --ios
# Press 'i' in the terminal to open iOS simulator
```

**For native features/testing (Xcode):**
```bash
cd mobile
npx expo prebuild --platform ios --clean
open ios/*.xcworkspace
# Build and run from Xcode
```

### 5. Reset Everything

If nothing works:
```bash
cd mobile

# Kill all processes
pkill -f "expo\|metro\|node.*mobile"

# Clean everything
rm -rf .expo node_modules/.cache ios android

# Reinstall
npm install

# Start fresh
npx expo start --clear --ios
```

## Current Setup

Your app is configured as:
- **Expo SDK**: ~54.0.12
- **React Native**: 0.81.4
- **Router**: expo-router
- **No native iOS folder** (using managed workflow)

This means you should use **Expo Go** for development, or run `npx expo prebuild` if you need native features.

