# Native iOS Driver App - Build Guide

## Overview

This guide covers building and deploying the HALCYON DRIVE native iOS app for drivers.

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com
   - Enroll in Apple Developer Program

2. **EAS CLI** (Expo Application Services)
   ```bash
   npm install -g eas-cli
   eas login
   ```

3. **Expo Account**
   - Sign up at: https://expo.dev
   - Link to your project: `eas init`

## Current App Status

### ✅ Already Implemented

- Location tracking service (background location)
- Trip management
- Dashboard
- Emergency button
- Profile management
- Push notifications setup
- Authentication
- WebSocket connection

### ⏳ Needs Configuration

- iOS bundle identifier
- App icons and splash screens
- Push notification certificates (APNs)
- App Store Connect setup
- TestFlight configuration

## Step 1: Configure App Metadata

### Update `app.json`

The app.json has been updated with:
- Bundle identifier: `com.halcyon.driver`
- Background modes: location, fetch, remote-notification
- Location permission descriptions

### Update Bundle Identifier (if needed)

If you need a different bundle identifier:
```json
"ios": {
  "bundleIdentifier": "com.yourcompany.halcyondriver"
}
```

## Step 2: Set Up EAS Build

### Initialize EAS

```bash
cd mobile
eas init
```

This will:
- Link your project to Expo
- Create `eas.json` (already created)
- Set up build profiles

### Configure Build Profiles

The `eas.json` file includes:
- **development**: For development builds with Expo Go
- **preview**: For TestFlight/internal testing
- **production**: For App Store submission

## Step 3: Build for iOS

### Development Build (for testing)

```bash
eas build --platform ios --profile development
```

### Preview Build (for TestFlight)

```bash
eas build --platform ios --profile preview
```

### Production Build (for App Store)

```bash
eas build --platform ios --profile production
```

## Step 4: Configure Push Notifications

### Generate APNs Key

1. Go to Apple Developer Portal
2. Navigate to Certificates, Identifiers & Profiles
3. Create a new Key with Apple Push Notifications service (APNs) enabled
4. Download the `.p8` key file
5. Note the Key ID and Team ID

### Add to EAS

```bash
eas credentials
```

Select:
- iOS
- Push Notifications
- Add new credentials
- Upload your `.p8` key file
- Enter Key ID and Team ID

## Step 5: TestFlight Setup

### Submit to TestFlight

After building:

```bash
eas submit --platform ios --profile preview
```

Or use EAS Submit in the Expo dashboard.

### Add Testers

1. Go to App Store Connect
2. Navigate to TestFlight
3. Add internal testers (up to 100)
4. Add external testers (up to 10,000)

## Step 6: App Store Submission

### Prepare App Store Listing

1. **App Information**
   - Name: HALCYON DRIVE
   - Subtitle: Driver App for Transportation Management
   - Description: [Write app description]
   - Keywords: driver, transportation, fleet, logistics
   - Category: Business

2. **Screenshots**
   - Required sizes:
     - 6.7" iPhone (1290 x 2796)
     - 6.5" iPhone (1242 x 2688)
     - 5.5" iPhone (1242 x 2208)

3. **App Icon**
   - 1024 x 1024 PNG
   - No transparency
   - No rounded corners (iOS adds them)

### Submit for Review

```bash
eas submit --platform ios --profile production
```

Or use App Store Connect web interface.

## Step 7: Testing Checklist

### Location Tracking

- [ ] Background location tracking works
- [ ] Location updates sent to backend
- [ ] Location visible on dashboard map
- [ ] Battery usage is reasonable

### Trip Management

- [ ] Trips load correctly
- [ ] Trip status updates work
- [ ] Trip details display correctly
- [ ] Navigation to trip works

### Emergency Button

- [ ] Emergency button triggers correctly
- [ ] Emergency notification sent
- [ ] Location included in emergency

### Notifications

- [ ] Push notifications received
- [ ] Notifications open correct screens
- [ ] Notification permissions work

### Authentication

- [ ] Login works
- [ ] Logout works
- [ ] Session persists
- [ ] Token refresh works

## Troubleshooting

### Build Fails

**Issue:** "No bundle identifier found"
**Solution:** Ensure `bundleIdentifier` is set in `app.json`

**Issue:** "Missing provisioning profile"
**Solution:** Run `eas credentials` to set up certificates

### Location Not Working

**Issue:** Location permission denied
**Solution:** Check `NSLocationAlwaysAndWhenInUseUsageDescription` in `app.json`

**Issue:** Background location stops
**Solution:** Ensure `UIBackgroundModes` includes `location` in `app.json`

### Push Notifications Not Working

**Issue:** Notifications not received
**Solution:** 
1. Check APNs key is configured in EAS
2. Verify device token is registered
3. Check notification permissions

## Next Steps

1. **Test on Physical Device**
   - Install development build
   - Test all features
   - Verify location tracking

2. **Beta Testing**
   - Submit to TestFlight
   - Add testers
   - Collect feedback

3. **App Store Submission**
   - Complete App Store listing
   - Submit for review
   - Monitor review status

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Apple Developer Portal](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)


