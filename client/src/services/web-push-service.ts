/**
 * Web Push Service (Frontend)
 * 
 * Handles push notification subscription and management
 */
import { apiRequest } from '../lib/queryClient';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class WebPushService {
  private registration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string | null = null;

  /**
   * Initialize service worker and get VAPID public key
   */
  async initialize(): Promise<void> {
    try {
      // Register service worker
      if ('serviceWorker' in navigator) {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered');
      } else {
        console.warn('⚠️ Service Workers not supported');
        return;
      }

      // Get VAPID public key from server
      try {
        const response = await apiRequest('GET', '/api/client-notifications/vapid-public-key');
        const data = await response.json();
        if (data.success && data.data?.publicKey) {
          this.vapidPublicKey = data.data.publicKey;
          console.log('✅ VAPID public key loaded');
        } else {
          console.warn('⚠️ VAPID public key not available');
        }
      } catch (error) {
        console.error('Error fetching VAPID public key:', error);
      }
    } catch (error) {
      console.error('Error initializing web push service:', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    // Request permission
    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(userId: string): Promise<PushSubscription | null> {
    try {
      // Check if service worker is registered
      if (!this.registration) {
        await this.initialize();
        if (!this.registration) {
          throw new Error('Service Worker not available');
        }
      }

      // Check if VAPID key is available
      if (!this.vapidPublicKey) {
        // Try to fetch it again
        try {
          const response = await apiRequest('GET', '/api/client-notifications/vapid-public-key');
          const data = await response.json();
          if (data.success && data.data?.publicKey) {
            this.vapidPublicKey = data.data.publicKey;
          } else {
            throw new Error('VAPID public key not available');
          }
        } catch (error) {
          console.error('Error fetching VAPID public key:', error);
          throw new Error('VAPID keys not configured on server');
        }
      }

      // Request permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Convert subscription to JSON format
      const subscriptionJson: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
        }
      };

      // Send subscription to server
      const response = await apiRequest('POST', '/api/client-notifications/subscribe', {
        userId,
        subscription: subscriptionJson
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to save subscription');
      }

      console.log('✅ Push subscription saved');
      return subscriptionJson;
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(subscriptionId: string): Promise<void> {
    try {
      // Unsubscribe from push manager
      if (this.registration) {
        const subscription = await this.registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // Remove from server
      await apiRequest('DELETE', `/api/client-notifications/subscribe/${subscriptionId}`);
      console.log('✅ Unsubscribed from push notifications');
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      throw error;
    }
  }

  /**
   * Check if user is subscribed
   */
  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.registration) {
        await this.initialize();
        if (!this.registration) {
          return false;
        }
      }

      const subscription = await this.registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  /**
   * Convert VAPID public key from base64 URL to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export const webPushService = new WebPushService();

