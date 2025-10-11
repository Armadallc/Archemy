import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'trip_update' | 'new_trip' | 'emergency' | 'system' | 'reminder';
  tripId?: string;
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Notification permission not granted');
        return;
      }

      // Get push token
      if (Device.isDevice) {
        this.expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('✅ Push token:', this.expoPushToken);
      } else {
        console.log('⚠️ Must use physical device for push notifications');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize notifications:', error);
    }
  }

  async scheduleLocalNotification(notificationData: NotificationData, delay: number = 0) {
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
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('✅ Notification cancelled:', notificationId);
    } catch (error) {
      console.error('❌ Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications() {
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
  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(listener: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const notificationService = new NotificationService();

