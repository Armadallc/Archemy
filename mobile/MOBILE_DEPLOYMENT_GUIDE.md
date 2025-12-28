# Mobile App Deployment Guide

## Overview

The mobile app is built with **Expo** (React Native). Unlike web apps, mobile apps cannot be "deployed to Render" - they need to be built and distributed through app stores or as standalone builds.

## Architecture

- **Backend**: Deployed on Render (e.g., `https://halcyon-backend.onrender.com`)
- **Mobile App**: Built with Expo, connects to Render backend
- **Distribution**: App stores (iOS/Android) or standalone builds

## Step 1: Configure Mobile App for Production

### Update Environment Variables

Create a `.env` file in the `mobile/` directory:

```bash
# Production API URL (your Render backend)
EXPO_PUBLIC_API_URL=https://halcyon-backend.onrender.com

# Production WebSocket URL (secure WebSocket)
EXPO_PUBLIC_WS_URL=wss://halcyon-backend.onrender.com
```

**Note:** Replace `halcyon-backend.onrender.com` with your actual Render backend URL.

### For Development (Local Testing)

If you want to test locally, create `.env.local`:

```bash
# Local development
EXPO_PUBLIC_API_URL=http://192.168.12.215:8081
EXPO_PUBLIC_WS_URL=ws://192.168.12.215:8081
```

## Step 2: Mobile App Deployment Options

### Option A: Expo Application Services (EAS) - Recommended

**EAS** is Expo's official build and deployment service.

#### Setup:

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS:**
   ```bash
   cd mobile
   eas build:configure
   ```

4. **Build for iOS:**
   ```bash
   eas build --platform ios
   ```

5. **Build for Android:**
   ```bash
   eas build --platform android
   ```

6. **Submit to App Stores:**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

#### Benefits:
- ✅ Cloud builds (no Mac needed for iOS)
- ✅ Automatic code signing
- ✅ App store submission
- ✅ Over-the-air (OTA) updates
- ✅ Free tier available

### Option B: Local Builds

#### iOS (Requires Mac + Xcode):

```bash
cd mobile
npx expo prebuild
npx expo run:ios --configuration Release
```

#### Android:

```bash
cd mobile
npx expo prebuild
npx expo run:android --configuration Release
```

### Option C: Expo Go (Development Only)

For testing during development:

```bash
cd mobile
npx expo start
```

Scan QR code with Expo Go app (iOS/Android).

**Limitations:**
- ❌ Not for production
- ❌ Limited native features
- ❌ Can't submit to app stores

## Step 3: App Store Submission

### iOS App Store

1. **Build with EAS:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

3. **Or manually:**
   - Download `.ipa` from EAS
   - Upload via Xcode or App Store Connect

### Google Play Store

1. **Build with EAS:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Submit to Play Store:**
   ```bash
   eas submit --platform android
   ```

3. **Or manually:**
   - Download `.aab` or `.apk` from EAS
   - Upload via Google Play Console

## Step 4: Environment-Specific Builds

### Development Build

```bash
# Uses .env.local or localhost
EXPO_PUBLIC_API_URL=http://localhost:8081 eas build --profile development
```

### Production Build

```bash
# Uses .env or Render URL
EXPO_PUBLIC_API_URL=https://halcyon-backend.onrender.com eas build --profile production
```

## Step 5: Over-the-Air (OTA) Updates

Update the app without rebuilding:

```bash
eas update --branch production --message "Update to latest version"
```

## Configuration Files

### `eas.json` (Create this file)

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Important Notes

1. **Render is for Backend Only**: Render hosts your backend API, not the mobile app
2. **Mobile Apps Need Native Builds**: Must be compiled for iOS/Android
3. **App Store Requirements**: 
   - iOS: Apple Developer account ($99/year)
   - Android: Google Play Developer account ($25 one-time)
4. **Environment Variables**: Use `EXPO_PUBLIC_*` prefix for client-side variables
5. **WebSocket**: Use `wss://` (secure) for production, `ws://` for development

## Quick Start Checklist

- [ ] Create `.env` file with Render backend URL
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login: `eas login`
- [ ] Configure: `eas build:configure`
- [ ] Build: `eas build --platform all`
- [ ] Test build on device
- [ ] Submit to app stores: `eas submit`

## Troubleshooting

### Can't connect to backend?
- Verify `EXPO_PUBLIC_API_URL` is set correctly
- Check Render backend is running
- Ensure CORS allows mobile app origin
- For physical devices, use Render URL (not localhost)

### Build fails?
- Check `app.json` configuration
- Verify all dependencies are installed
- Review EAS build logs

### WebSocket not connecting?
- Use `wss://` for production (secure WebSocket)
- Verify Render supports WebSocket (it does)
- Check firewall/network settings




