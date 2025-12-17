import { Platform } from 'react-native';

// Conditionally import SecureStore only on native to prevent web bundler issues
let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    console.warn('SecureStore not available:', e);
  }
}

export type NavigationApp = 'google_maps' | 'apple_maps' | 'waze' | 'default';

const STORAGE_KEY = 'halcyon_navigation_app_preference';

/**
 * Navigation Preferences Service
 * Manages driver's preferred navigation app for directions
 */
class NavigationPreferencesService {
  /**
   * Get the driver's preferred navigation app
   * @returns The preferred navigation app, or 'default' if not set
   */
  async getPreferredApp(): Promise<NavigationApp> {
    try {
      let stored: string | null = null;
      if (Platform.OS === 'web') {
        stored = localStorage.getItem(STORAGE_KEY);
      } else if (SecureStore) {
        stored = await SecureStore.getItemAsync(STORAGE_KEY);
      }
      
      if (stored) {
        return stored as NavigationApp;
      }
      // Default based on platform
      return Platform.OS === 'ios' ? 'apple_maps' : 'google_maps';
    } catch (error) {
      console.error('Error getting navigation preference:', error);
      return Platform.OS === 'ios' ? 'apple_maps' : 'google_maps';
    }
  }

  /**
   * Set the driver's preferred navigation app
   * @param app The navigation app to set as preferred
   */
  async setPreferredApp(app: NavigationApp): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, app);
      } else if (SecureStore) {
        await SecureStore.setItemAsync(STORAGE_KEY, app);
      } else {
        throw new Error('Storage not available');
      }
    } catch (error) {
      console.error('Error setting navigation preference:', error);
      throw error;
    }
  }

  /**
   * Get available navigation apps for the current platform
   */
  getAvailableApps(): Array<{ value: NavigationApp; label: string; icon: string }> {
    const apps = [
      { value: 'google_maps' as NavigationApp, label: 'Google Maps', icon: 'logo-google' },
      { value: 'apple_maps' as NavigationApp, label: 'Apple Maps', icon: 'map' },
      { value: 'waze' as NavigationApp, label: 'Waze', icon: 'car' },
      { value: 'default' as NavigationApp, label: 'Default (System)', icon: 'navigate' },
    ];

    // Filter based on platform if needed
    // Note: All apps are available on both platforms, but some may not be installed
    return apps;
  }
}

export const navigationPreferences = new NavigationPreferencesService();





