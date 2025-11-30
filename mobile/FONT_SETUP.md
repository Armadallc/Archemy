# Nohemi Font Setup for React Native

## Current Status

✅ **Nohemi TTF fonts are now installed and configured!**

All 9 font weights have been copied from `assets/nohemi font/` to `mobile/assets/fonts/` and the app is configured to load them.

## Getting TTF Font Files

Nohemi font is available in TTF format from the designer's official page:

**Download Link:** https://rajputrajesh-448.gumroad.com/l/NOHEMI9

The font package includes all 9 weights:
- Nohemi-Thin.ttf (100)
- Nohemi-ExtraLight.ttf (200)
- Nohemi-Light.ttf (300)
- Nohemi-Regular.ttf (400)
- Nohemi-Medium.ttf (500)
- Nohemi-SemiBold.ttf (600)
- Nohemi-Bold.ttf (700)
- Nohemi-ExtraBold.ttf (800)
- Nohemi-Black.ttf (900)

## Setup Complete ✅

All TTF font files have been:
1. ✅ Copied from `assets/nohemi font/` to `mobile/assets/fonts/`
2. ✅ Font loading enabled in `mobile/app/_layout.tsx`
3. ✅ ThemeContext updated to use `Nohemi-Regular` as base font
4. ✅ Typography constants updated with weight mapping

**Installed Font Files:**
```
mobile/assets/fonts/
├── Nohemi-Thin.ttf (100)
├── Nohemi-ExtraLight.ttf (200)
├── Nohemi-Light.ttf (300)
├── Nohemi-Regular.ttf (400)
├── Nohemi-Medium.ttf (500)
├── Nohemi-SemiBold.ttf (600)
├── Nohemi-Bold.ttf (700)
├── Nohemi-ExtraBold.ttf (800)
└── Nohemi-Black.ttf (900)
```

## Alternative: Convert WOFF2 to TTF

If you prefer to convert the existing `.woff2` files to `.ttf`, you can use online converters or tools like:
- https://cloudconvert.com/woff2-to-ttf
- FontForge (desktop application)

However, downloading the official TTF files is recommended for best quality.

## Current Implementation

The app is currently configured to:
- ✅ Load TTF fonts when available (via `expo-font`)
- ✅ Fall back to system fonts if TTF files are missing
- ✅ Use theme system with proper typography scale
- ✅ Support all font weights through the theme system

Once TTF files are added, the fonts will automatically load and be used throughout the app.

