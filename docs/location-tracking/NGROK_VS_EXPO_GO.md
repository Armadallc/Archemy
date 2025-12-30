# ngrok vs Expo Go: Why We're Using ngrok

## The Question
Why are we using ngrok instead of Expo Go for mobile development and location tracking?

## Historical Context

**Important**: We have been using **Expo Go** throughout the life of this project. We only switched to ngrok today (December 29, 2025) to troubleshoot two specific issues:

1. **Location tracking not working**: Mobile Safari blocks geolocation over HTTP, requiring HTTPS
2. **PWA (Progressive Web App) home screen issue**: When adding the PWA URL to the home screen, the app displayed "Not Found" errors

**Previous Setup (Expo Go)**:
- The mobile app was developed and tested using Expo Go
- Developers would run `expo start` and scan the QR code with the Expo Go app
- This worked well for general development and testing
- Location tracking may have worked in Expo Go because it uses native permissions (not browser geolocation API)

**Why We Switched to ngrok Today**:
- Testing the PWA functionality (adding to home screen) revealed issues
- Location tracking was not working when accessing the app via browser/PWA
- Mobile Safari requires HTTPS for geolocation API
- ngrok provides HTTPS tunnels to our local development server
- This allows us to test the PWA and location tracking in a browser environment

## The Answer

### Expo Go is for Native Apps, Not Web Apps

**Expo Go** is designed for **native React Native apps**:
- Expo Go runs native React Native code directly on the device
- It requires the Expo Go app to be installed on the device
- It connects to the Expo development server for hot reloading
- **Expo Go does NOT run web apps**

**Our mobile app is a web app (PWA)**:
- It runs in Safari/Chrome as a Progressive Web App
- It uses Expo Router for file-based routing
- It's accessed via a URL (e.g., `http://localhost:8082` or `https://ngrok-url`)
- It's not a native app, so Expo Go cannot run it
- **Note**: While we've been using Expo Go for development, the app can also run as a PWA in browsers, which is what we're testing with ngrok

### Why We Need ngrok (For PWA/Browser Testing)

**Mobile Safari blocks geolocation over HTTP**:
- Location tracking requires HTTPS in modern browsers when using the browser geolocation API
- Our local development server runs on HTTP (`http://localhost:8081`)
- Mobile Safari will block location requests from HTTP origins
- **ngrok provides HTTPS tunnels** to our local development server
- **Important**: This is only needed for browser/PWA testing. Expo Go uses native permissions and doesn't require HTTPS

**The flow**:
1. Backend runs on `http://localhost:8081` (HTTP)
2. Frontend (Expo web) runs on `http://localhost:8082` (HTTP)
3. ngrok creates HTTPS tunnels:
   - `https://[ngrok-url].ngrok-free.app` → `http://localhost:8081` (backend)
   - `https://[ngrok-url].ngrok-free.app` → `http://localhost:8082` (frontend)
4. Mobile device accesses the app via HTTPS ngrok URL
5. Location tracking works because the origin is HTTPS

## Alternatives to Manual ngrok Setup

### 1. **Expo's Built-in Tunnel Mode** (Recommended for Quick Testing)

Expo has built-in ngrok integration via tunnel mode:

```bash
cd mobile
npx expo start --tunnel --web
```

**Advantages**:
- Simpler than manual ngrok setup
- Automatically handles tunnel creation
- No need to manually configure ngrok URLs
- Expo handles the tunnel lifecycle

**How it works**:
- Expo uses ngrok under the hood
- Automatically updates the app to use the tunnel URL
- Tunnel URL is displayed in the terminal

**Configuration**:
- Update `mobile/.env` to use the tunnel URL:
  ```env
  EXPO_PUBLIC_API_URL=https://[expo-tunnel-url]
  EXPO_PUBLIC_WS_URL=wss://[expo-tunnel-url]
  ```

### 2. **Convert to Native Expo App** (For Expo Go)

If you want to use Expo Go, you'd need to:

1. **Convert the mobile app to a native Expo app**:
   - Remove web-specific code
   - Use native Expo APIs instead of web APIs
   - Build for iOS/Android instead of web

2. **Run in Expo Go**:
   - Install Expo Go app on device
   - Scan QR code from `expo start`
   - App runs natively on device

3. **Benefits**:
   - No HTTPS needed for location (uses native permissions)
   - Better performance (native code)
   - Access to native device features
   - Can be published to App Store/Play Store

4. **Drawbacks**:
   - Requires significant refactoring
   - Can't run as a web app anymore
   - Need to maintain separate native/web codebases

### 3. **Local HTTPS with mkcert**

Create local SSL certificates for development:

**Setup**:
```bash
# Install mkcert
brew install mkcert

# Create local CA
mkcert -install

# Generate certificates
mkcert localhost 192.168.12.227

# Update server to use HTTPS
# Update mobile app to use https://192.168.12.227:8082
```

**Advantages**:
- No external tunnel needed
- Works offline
- Faster than ngrok (no external network)

**Drawbacks**:
- Requires certificate management
- Need to trust the local CA on each device
- More complex setup

### 4. **Test on Render (Production)**

Use the production Render deployment:

**Advantages**:
- Render provides HTTPS automatically
- No local setup needed
- Closer to production environment

**Drawbacks**:
- Requires deploying changes to test
- Slower development cycle
- May have different behavior than local

## Current Setup (As of December 29, 2025)

**What we're using for PWA/browser testing**:
- Manual ngrok setup with separate tunnels for frontend and backend
- Frontend: `https://df6fc2959264.ngrok-free.app` → `http://localhost:8082`
- Backend: `https://5b3352e68162.ngrok-free.app` → `http://localhost:8081`

**Configuration files**:
- `mobile/.env`: Contains ngrok URLs for API and WebSocket
- `server/index.ts`: CORS configuration for ngrok domains

**Previous setup (Expo Go)**:
- `expo start` → QR code → Expo Go app
- No HTTPS required (uses native permissions)
- Works for general development and testing
- Still available for native app development

## Recommendation

**For native app development (what we've been doing)**: Continue using Expo Go
- `expo start` → Scan QR code with Expo Go app
- No HTTPS required
- Native permissions for location tracking
- Best performance for native features
- Can publish to app stores

**For PWA/browser testing (what we're doing now)**: Use ngrok or Expo tunnel mode
- **Expo's tunnel mode** (`expo start --tunnel --web`): Simplest setup, automatic tunnel management
- **Manual ngrok**: More control, separate tunnels for frontend/backend
- Required for testing PWA functionality and browser-based location tracking

**For production-like testing**: Use Render deployment
- Real HTTPS environment
- No local setup needed
- Closest to production environment

## Related Documentation

- `docs/location-tracking/QUICK_NGROK_SETUP.md` - Manual ngrok setup guide
- `docs/location-tracking/SETUP_HTTPS_FOR_DEVELOPMENT.md` - mkcert setup guide
- `docs/location-tracking/MOBILE_SAFARI_LOCATION_TRACKING.md` - HTTPS requirement explanation
- `docs/PWA_MOBILE_TESTING.md` - PWA testing on mobile devices

