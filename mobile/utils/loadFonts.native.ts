/**
 * Font loading for native platforms only
 * This file is never imported on web, preventing bundler from processing TTF files
 */

export const getFontConfig = () => {
  return {
    'Nohemi-Thin': require('../assets/fonts/Nohemi-Thin.ttf'),
    'Nohemi-ExtraLight': require('../assets/fonts/Nohemi-ExtraLight.ttf'),
    'Nohemi-Light': require('../assets/fonts/Nohemi-Light.ttf'),
    'Nohemi-Regular': require('../assets/fonts/Nohemi-Regular.ttf'),
    'Nohemi-Medium': require('../assets/fonts/Nohemi-Medium.ttf'),
    'Nohemi-SemiBold': require('../assets/fonts/Nohemi-SemiBold.ttf'),
    'Nohemi-Bold': require('../assets/fonts/Nohemi-Bold.ttf'),
    'Nohemi-ExtraBold': require('../assets/fonts/Nohemi-ExtraBold.ttf'),
    'Nohemi-Black': require('../assets/fonts/Nohemi-Black.ttf'),
  };
};

