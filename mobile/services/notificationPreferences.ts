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

export type NotificationType = 
  | 'new_trip' 
  | 'trip_update' 
  | 'trip_reminder' 
  | 'emergency' 
  | 'system';

export interface NotificationPreferences {
  newTrip: boolean;
  tripUpdate: boolean;
  tripReminder: boolean;
  emergency: boolean;
  system: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const STORAGE_KEY = 'halcyon_notification_preferences';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  newTrip: true,
  tripUpdate: true,
  tripReminder: true,
  emergency: true, // Always enabled for safety
  system: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

/**
 * Notification Preferences Service
 * Manages driver's notification preferences
 */
class NotificationPreferencesService {
  /**
   * Get the driver's notification preferences
   * @returns The notification preferences, or defaults if not set
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      let stored: string | null = null;
      if (Platform.OS === 'web') {
        stored = localStorage.getItem(STORAGE_KEY);
      } else if (SecureStore) {
        stored = await SecureStore.getItemAsync(STORAGE_KEY);
      }
      
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all fields exist
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
      return { ...DEFAULT_PREFERENCES };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return { ...DEFAULT_PREFERENCES };
    }
  }

  /**
   * Set the driver's notification preferences
   * @param preferences The notification preferences to set
   */
  async setPreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = { ...current, ...preferences };
      
      // Ensure emergency notifications are always enabled
      updated.emergency = true;
      
      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } else if (SecureStore) {
        await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated));
      } else {
        throw new Error('Storage not available');
      }
    } catch (error) {
      console.error('Error setting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Check if a specific notification type is enabled
   * @param type The notification type to check
   * @returns Whether the notification type is enabled
   */
  async isEnabled(type: NotificationType): Promise<boolean> {
    const preferences = await this.getPreferences();
    switch (type) {
      case 'new_trip':
        return preferences.newTrip;
      case 'trip_update':
        return preferences.tripUpdate;
      case 'trip_reminder':
        return preferences.tripReminder;
      case 'emergency':
        return preferences.emergency; // Always true
      case 'system':
        return preferences.system;
      default:
        return true;
    }
  }

  /**
   * Get notification type labels
   */
  getNotificationTypeLabels(): Record<NotificationType, { label: string; description: string; icon: string }> {
    return {
      new_trip: {
        label: 'New Trip Assignments',
        description: 'Get notified when new trips are assigned to you',
        icon: 'car',
      },
      trip_update: {
        label: 'Trip Updates',
        description: 'Get notified about trip status changes, time updates, and cancellations',
        icon: 'refresh',
      },
      trip_reminder: {
        label: 'Trip Reminders',
        description: 'Get reminded about upcoming trips before they start',
        icon: 'time',
      },
      emergency: {
        label: 'Emergency Alerts',
        description: 'Critical emergency notifications (always enabled)',
        icon: 'warning',
      },
      system: {
        label: 'System Notifications',
        description: 'App updates, maintenance, and important announcements',
        icon: 'information-circle',
      },
    };
  }
}

export const notificationPreferences = new NotificationPreferencesService();





