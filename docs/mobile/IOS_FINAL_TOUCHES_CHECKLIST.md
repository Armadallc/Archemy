# iOS Native App - Final Touches Checklist

## Recommended Workflow

**Work on final touches → Test locally → Build when ready**

This approach is better because:
- ✅ Faster iteration (test changes immediately)
- ✅ No build wait times during development
- ✅ Catch issues before building
- ✅ Polish the app before distribution
- ✅ Save EAS build credits

## Development Workflow

### 1. Test Locally (Fast Iteration)

```bash
cd mobile

# Run in iOS Simulator
npm run ios

# Or run on physical device (via Expo Go or development build)
npm run dev
```

**Benefits:**
- Instant feedback on changes
- No build wait times
- Test all features quickly
- Debug easily

### 2. Work on Final Touches

See checklist below for what to polish.

### 3. Build When Ready

Once everything is polished:
```bash
npm run eas:build:ios:preview
```

## Final Touches Checklist

### UI/UX Polish

- [ ] **App Icons & Splash Screens**
  - [ ] Create 1024x1024 app icon
  - [ ] Create splash screen images
  - [ ] Test on different device sizes

- [ ] **Navigation & Flow**
  - [ ] Test all navigation paths
  - [ ] Ensure back buttons work correctly
  - [ ] Test deep linking (if implemented)
  - [ ] Verify tab navigation is smooth

- [ ] **Visual Consistency**
  - [ ] Check all screens use consistent styling
  - [ ] Verify neumorphic design is applied consistently
  - [ ] Test dark mode (if supported)
  - [ ] Check spacing and alignment

### iOS-Specific Optimizations

- [ ] **Remove/Update Web-Specific Code**
  - [ ] Review `Platform.OS === 'web'` checks
  - [ ] Remove web-only features from native build
  - [ ] Optimize for iOS-specific APIs
  - [ ] Test that web fallbacks don't break iOS

- [ ] **Performance**
  - [ ] Test app startup time
  - [ ] Check memory usage
  - [ ] Test with many trips loaded
  - [ ] Verify smooth scrolling

- [ ] **iOS Design Guidelines**
  - [ ] Follow iOS Human Interface Guidelines
  - [ ] Test on different iPhone sizes
  - [ ] Verify safe area handling
  - [ ] Check status bar styling

### Location Tracking

- [ ] **Background Location**
  - [ ] Test background location tracking
  - [ ] Verify location updates continue when app is backgrounded
  - [ ] Test location accuracy
  - [ ] Check battery usage

- [ ] **Permissions**
  - [ ] Test permission flow
  - [ ] Verify permission messages are clear
  - [ ] Test "Open Settings" button works
  - [ ] Test permission denied handling

### Core Features

- [ ] **Trip Management**
  - [ ] Test trip loading
  - [ ] Test trip status updates
  - [ ] Test trip details view
  - [ ] Test navigation to trip locations

- [ ] **Emergency Button**
  - [ ] Test emergency button triggers
  - [ ] Verify emergency notifications sent
  - [ ] Test emergency location sharing

- [ ] **Notifications**
  - [ ] Test push notifications
  - [ ] Test notification permissions
  - [ ] Verify notifications open correct screens
  - [ ] Test notification sounds/vibrations

- [ ] **Authentication**
  - [ ] Test login flow
  - [ ] Test logout
  - [ ] Test session persistence
  - [ ] Test token refresh

### Error Handling

- [ ] **Network Errors**
  - [ ] Test offline behavior
  - [ ] Test API error handling
  - [ ] Verify error messages are user-friendly
  - [ ] Test retry mechanisms

- [ ] **Edge Cases**
  - [ ] Test with no trips
  - [ ] Test with many trips
  - [ ] Test with slow network
  - [ ] Test with invalid data

### Testing

- [ ] **Device Testing**
  - [ ] Test on physical iPhone
  - [ ] Test on different iOS versions (if possible)
  - [ ] Test on different screen sizes
  - [ ] Test with real location data

- [ ] **User Flow Testing**
  - [ ] Complete driver onboarding flow
  - [ ] Test complete trip lifecycle
  - [ ] Test emergency scenario
  - [ ] Test all user interactions

## Code Cleanup

### Web-Specific Code to Review

**Files with `Platform.OS === 'web'` checks:**
- `mobile/services/api.ts` - API URL configuration
- `mobile/services/websocket.ts` - WebSocket URL configuration
- `mobile/services/locationTracking.ts` - Location permission handling
- `mobile/app/(tabs)/dashboard.tsx` - Web-specific styling
- `mobile/app/(tabs)/trip-details.tsx` - Web-specific features
- `mobile/app/(tabs)/chat.tsx` - Web-specific layout
- `mobile/contexts/AuthContext.tsx` - Web storage fallbacks

**Action Items:**
- [ ] Ensure web checks don't break iOS functionality
- [ ] Remove web-only features from production iOS build
- [ ] Optimize iOS-specific code paths
- [ ] Test that iOS uses correct code paths

### Environment Variables

- [ ] **Production Configuration**
  - [ ] Set `EXPO_PUBLIC_API_URL` for production
  - [ ] Set `EXPO_PUBLIC_WS_URL` for production
  - [ ] Remove development URLs from production build
  - [ ] Test with production backend

## Before Building

### Final Checks

- [ ] All features tested and working
- [ ] No console errors or warnings
- [ ] App icons and splash screens ready
- [ ] Environment variables configured
- [ ] Code reviewed and cleaned up
- [ ] Performance is acceptable
- [ ] Battery usage is reasonable

### Build Preparation

- [ ] Apple Developer account ready
- [ ] Bundle identifier confirmed (`com.halcyon.driver`)
- [ ] App Store Connect app created (optional, can do after build)
- [ ] TestFlight testers identified (optional)

## Recommended Order

1. **Test locally** (`npm run ios`)
2. **Work through checklist** (UI/UX, iOS optimizations, features)
3. **Test on physical device** (if possible)
4. **Final code cleanup**
5. **Build** (`npm run eas:build:ios:preview`)

## Quick Commands

```bash
# Local development (fast iteration)
cd mobile
npm run ios              # iOS Simulator
npm run dev              # Development mode

# Testing
npm run dev:clear        # Clear cache and restart

# When ready to build
npm run eas:build:ios:preview  # TestFlight build
npm run eas:build:ios:prod     # App Store build
```

## Tips

- **Use iOS Simulator** for quick testing during development
- **Test on physical device** before building (if possible)
- **Iterate quickly** - make changes, test, repeat
- **Build only when ready** - saves time and EAS credits
- **Keep web code** - you'll still need it for PWA later


