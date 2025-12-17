import { Linking, Platform, Alert } from 'react-native';
import { NavigationApp } from '../services/navigationPreferences';

/**
 * Build navigation URL for different apps
 */
export function buildNavigationUrl(
  app: NavigationApp,
  destination: string,
  source?: string | null
): string {
  const encodedDestination = encodeURIComponent(destination);
  const encodedSource = source ? encodeURIComponent(source) : 'Current+Location';

  switch (app) {
    case 'google_maps':
      if (source) {
        return `https://maps.google.com/maps?saddr=${source}&daddr=${encodedDestination}`;
      }
      return `https://maps.google.com/maps?daddr=${encodedDestination}`;

    case 'apple_maps':
      if (source) {
        return `http://maps.apple.com/?saddr=${source}&daddr=${encodedDestination}`;
      }
      return `http://maps.apple.com/?daddr=${encodedDestination}`;

    case 'waze':
      // Waze uses a different URL format - it doesn't support source addresses
      // Format: waze://?navigate=yes&q=ADDRESS or waze://?ll=LAT,LNG&navigate=yes
      return `waze://?navigate=yes&q=${encodedDestination}`;

    case 'default':
      // Use platform default
      if (Platform.OS === 'ios') {
        if (source) {
          return `http://maps.apple.com/?saddr=${source}&daddr=${encodedDestination}`;
        }
        return `http://maps.apple.com/?daddr=${encodedDestination}`;
      } else {
        if (source) {
          return `https://maps.google.com/maps?saddr=${source}&daddr=${encodedDestination}`;
        }
        return `https://maps.google.com/maps?daddr=${encodedDestination}`;
      }

    default:
      // Fallback to Google Maps
      if (source) {
        return `https://maps.google.com/maps?saddr=${source}&daddr=${encodedDestination}`;
      }
      return `https://maps.google.com/maps?daddr=${encodedDestination}`;
  }
}

/**
 * Open navigation in the preferred app with fallback
 */
export async function openNavigation(
  preferredApp: NavigationApp,
  destination: string,
  source?: string | null
): Promise<void> {
  const url = buildNavigationUrl(preferredApp, destination, source);

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Fallback to default app
      const fallbackApp: NavigationApp = Platform.OS === 'ios' ? 'apple_maps' : 'google_maps';
      const fallbackUrl = buildNavigationUrl(fallbackApp, destination, source);
      const canOpenFallback = await Linking.canOpenURL(fallbackUrl);
      
      if (canOpenFallback) {
        await Linking.openURL(fallbackUrl);
        Alert.alert(
          'App Not Available',
          `${getAppName(preferredApp)} is not installed. Opened ${getAppName(fallbackApp)} instead.`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('No navigation app available');
      }
    }
  } catch (error) {
    console.error('Error opening navigation:', error);
    Alert.alert('Error', 'Could not open navigation application. Please install a maps app.');
  }
}

/**
 * Get human-readable app name
 */
function getAppName(app: NavigationApp): string {
  switch (app) {
    case 'google_maps':
      return 'Google Maps';
    case 'apple_maps':
      return 'Apple Maps';
    case 'waze':
      return 'Waze';
    case 'default':
      return 'Default Maps';
    default:
      return 'Maps';
  }
}





