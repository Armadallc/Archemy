import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Conditionally import native modules only on native platforms to prevent web bundler issues
let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
    
    // Configure notification behavior (skip on web)
    if (Notifications) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }
  } catch (e) {
    console.warn('Native notification modules not available:', e);
  }
}

export interface NotificationData {
  type: 'trip_update' | 'new_trip' | 'emergency' | 'system' | 'reminder';
  tripId?: string;
  title: string;
  body: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  author?: {
    userId?: string;
    name?: string;
    role?: string;
  };
  timestamp?: string;
  read?: boolean;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Skip native notifications on web
    if (Platform.OS === 'web') {
      console.log('⚠️ Native notifications not available on web');
      this.isInitialized = true;
      return;
    }

    if (!Notifications || !Device) {
      console.log('⚠️ Notification modules not available');
      return;
    }

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('⚠️ Notification permission not granted - notifications will be limited');
        this.isInitialized = true; // Mark as initialized even without permission
        return;
      }

      // Get push token (only on physical devices)
      if (Device.isDevice) {
        try {
          // Try to get project ID from Constants, but don't require it
          const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
          const tokenOptions = projectId ? { projectId } : undefined;
          
          const tokenData = await Notifications.getExpoPushTokenAsync(tokenOptions);
          this.expoPushToken = tokenData.data;
          console.log('✅ Push token obtained:', this.expoPushToken);
        } catch (tokenError: any) {
          // Push token errors are non-critical - app can still work with local notifications
          console.warn('⚠️ Could not get push token (local notifications will still work):', tokenError?.message || tokenError);
        }
      } else {
        console.log('ℹ️ Running on simulator/emulator - push notifications require a physical device');
      }

      this.isInitialized = true;
      console.log('✅ Notifications initialized successfully');
    } catch (error: any) {
      // Don't throw - allow app to continue without notifications
      console.warn('⚠️ Failed to initialize notifications (app will continue without push notifications):', error?.message || error);
      this.isInitialized = true; // Mark as initialized to prevent retry loops
    }
  }

  async scheduleLocalNotification(notificationData: NotificationData, delay: number = 0) {
    // Skip native notifications on web - use console log instead
    if (Platform.OS === 'web') {
      console.log('📱 [Web Notification]', notificationData.title, '-', notificationData.body);
      return 'web-notification';
    }

    if (!Notifications) {
      console.warn('Notifications module not available');
      return 'web-notification';
    }

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: {
            type: notificationData.type,
            tripId: notificationData.tripId,
            ...notificationData.data,
          },
          sound: notificationData.type === 'emergency' ? 'default' : 'default',
          priority: notificationData.type === 'emergency' ? Notifications.AndroidNotificationPriority.HIGH : Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: delay > 0 ? { seconds: delay } : null,
      });

      console.log('✅ Local notification scheduled:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      throw error;
    }
  }

  async showTripUpdateNotification(tripId: string, status: string, clientName: string) {
    const statusText = status.replace('_', ' ').toUpperCase();
    const title = `Trip ${statusText}`;
    const body = `Trip for ${clientName} has been updated to ${statusText}`;

    return this.scheduleLocalNotification({
      type: 'trip_update',
      tripId,
      title,
      body,
      data: { status, clientName },
    });
  }

  async showNewTripNotification(tripId: string, clientName: string, pickupTime: string) {
    const title = 'New Trip Assigned';
    const body = `You have a new trip for ${clientName} at ${new Date(pickupTime).toLocaleTimeString()}`;

    return this.scheduleLocalNotification({
      type: 'new_trip',
      tripId,
      title,
      body,
      data: { clientName, pickupTime },
    });
  }

  async showEmergencyNotification(tripId: string, message: string) {
    const title = '🚨 EMERGENCY ALERT';
    const body = message;

    return this.scheduleLocalNotification({
      type: 'emergency',
      tripId,
      title,
      body,
      data: { isEmergency: true },
    });
  }

  async showReminderNotification(tripId: string, clientName: string, minutesUntilPickup: number) {
    const title = 'Trip Reminder';
    const body = `Pickup for ${clientName} in ${minutesUntilPickup} minutes`;

    return this.scheduleLocalNotification({
      type: 'reminder',
      tripId,
      title,
      body,
      data: { clientName, minutesUntilPickup },
    });
  }

  async showSystemNotification(title: string, body: string) {
    return this.scheduleLocalNotification({
      type: 'system',
      title,
      body,
    });
  }

  async cancelNotification(notificationId: string) {
    if (Platform.OS === 'web') {
      console.log('📱 [Web] Notification cancellation not needed on web');
      return;
    }

    if (!Notifications) return;

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('✅ Notification cancelled:', notificationId);
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications() {
    if (Platform.OS === 'web') {
      console.log('📱 [Web] Notification cancellation not needed on web');
      return;
    }

    if (!Notifications) return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All notifications cancelled');
    } catch (error) {
      console.error('❌ Failed to cancel all notifications:', error);
    }
  }

  getExpoPushToken() {
    return this.expoPushToken;
  }

  // Listen for notification events
  addNotificationReceivedListener(listener: (notification: any) => void) {
    if (Platform.OS === 'web' || !Notifications) {
      // Return a no-op subscription for web or when Notifications is not available
      return { remove: () => {} };
    }
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(listener: (response: any) => void) {
    if (Platform.OS === 'web' || !Notifications) {
      // Return a no-op subscription for web or when Notifications is not available
      return { remove: () => {} };
    }
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const notificationService = new NotificationService();

