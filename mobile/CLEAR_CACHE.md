# Clear Cache Instructions

The chat component has been updated to remove swipe-to-delete for messages. If you're still seeing delete icons, you need to clear caches:

## For Development (Expo/Metro):

1. **Stop the Metro bundler** (Ctrl+C)

2. **Clear Metro cache:**
   ```bash
   npx expo start --clear
   ```
   OR
   ```bash
   npm start -- --reset-cache
   ```

3. **Clear watchman cache (if using):**
   ```bash
   watchman watch-del-all
   ```

4. **Clear node_modules and reinstall (if needed):**
   ```bash
   rm -rf node_modules
   npm install
   ```

## For Mobile Device:

1. **iOS Simulator:**
   - Device → Erase All Content and Settings
   - OR: Delete the app and reinstall

2. **Android Emulator:**
   - Settings → Apps → [Your App] → Clear Data
   - OR: Uninstall and reinstall

3. **Physical Device:**
   - Delete the app completely
   - Reinstall from development build

## Quick Fix:

If using Expo Go:
1. Shake device → Reload
2. If that doesn't work: Shake device → Reload → Clear cache

## Verify the Fix:

After clearing cache, the MessageComponent should:
- ✅ NOT show delete icons before swiping
- ✅ Only show delete option via long-press → action sheet
- ✅ Have no swipe functionality for messages

