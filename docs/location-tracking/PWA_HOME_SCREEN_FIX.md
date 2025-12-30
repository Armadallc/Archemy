# PWA Home Screen "Not Found" Fix

## Problem

When adding the mobile app PWA to the home screen and opening it from there, the app displays "Not Found" instead of loading properly.

## Root Cause

When a PWA is launched from the home screen, the browser may try to access a route that doesn't match any defined routes in Expo Router, causing a 404 error.

## Solution

### 1. Added Catch-All Route (`app/[...missing].tsx`)

Created a catch-all route that handles any unmatched paths and redirects users to the appropriate route based on their authentication status:

- **Not authenticated**: Redirects to `/(auth)/login`
- **Authenticated**: Redirects to `/(tabs)/dashboard`

### 2. Enhanced Root Route (`app/index.tsx`)

Added debugging logs to help diagnose routing issues when the app is launched from the home screen.

### 3. PWA Configuration (`app.json`)

Verified that the PWA configuration is correct:
- `startUrl: "/"` - Starts at root path
- `scope: "/"` - App scope is root
- `display: "standalone"` - Opens in standalone mode

## Testing

### Steps to Test:

1. **Open the app in browser**: `http://localhost:8082`
2. **Add to home screen**:
   - **iOS (Safari)**: Share → "Add to Home Screen"
   - **Android (Chrome)**: Menu → "Add to Home Screen" or "Install App"
3. **Open from home screen**: Tap the app icon on your home screen
4. **Check console logs**: Open browser DevTools (if possible) to see routing logs
5. **Verify behavior**:
   - Should redirect to login if not authenticated
   - Should redirect to dashboard if authenticated
   - Should NOT show "Not Found" error

### Expected Console Logs:

When opening from home screen, you should see:
```
📍 Index route loaded { pathname: '/', href: 'http://localhost:8082/', ... }
```

Or if catch-all route is triggered:
```
📍 Catch-all route triggered (404) { pathname: '/some-path', ... }
📍 404: No user, redirecting to login
```

## Files Changed

1. **`mobile/app/[...missing].tsx`** (NEW)
   - Catch-all route for unmatched paths
   - Redirects based on auth status

2. **`mobile/app/index.tsx`** (UPDATED)
   - Added debugging logs
   - Better error handling

3. **`mobile/app.json`** (VERIFIED)
   - PWA configuration is correct

## Troubleshooting

### Still seeing "Not Found"?

1. **Clear browser cache**: The PWA might be using cached routes
2. **Remove and re-add to home screen**: The home screen shortcut might be pointing to an old URL
3. **Check browser console**: Look for routing errors or 404 messages
4. **Verify URL**: Make sure the home screen shortcut points to the correct URL (should be `http://localhost:8082/` or your deployed URL)

### PWA not updating?

1. **Uninstall PWA**: Remove from home screen
2. **Clear browser cache**: Clear all site data
3. **Re-add to home screen**: Add the PWA again
4. **Hard refresh**: In browser, do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Routes not working?

1. **Check Expo Router version**: Ensure you're using a compatible version
2. **Verify route structure**: Make sure all routes are properly defined
3. **Check for typos**: Verify route names match exactly

## Additional Notes

- The catch-all route (`[...missing].tsx`) will catch ANY unmatched route
- It automatically redirects based on authentication status
- Debugging logs help identify routing issues
- The fix works for both development (`localhost:8082`) and production (deployed PWA)

## Next Steps

If the issue persists:

1. Check browser console for specific errors
2. Verify the home screen shortcut URL
3. Test on different browsers/devices
4. Check if the issue is specific to certain routes
5. Verify Expo Router is handling routes correctly



