/**
 * Push Notification Service
 * 
 * Sends web push notifications to subscribed clients
 */
import webpush from 'web-push';
import { supabase } from '../db';
import { vapidKeysService } from './vapid-keys';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  tag?: string; // For grouping notifications
  requireInteraction?: boolean;
  silent?: boolean;
}

class PushNotificationService {
  /**
   * Send push notification to a specific user
   */
  async sendPushNotification(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<{ sent: number; failed: number }> {
    try {
      // Get all active subscriptions for user
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching push subscriptions:', error);
        throw error;
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No active subscriptions found for user ${userId}`);
        return { sent: 0, failed: 0 };
      }

      // Ensure VAPID keys are configured
      if (!vapidKeysService.isConfigured()) {
        throw new Error('VAPID keys not configured');
      }

      // Prepare notification payload
      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-96x96.png',
        image: payload.image,
        data: payload.data || {},
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false
      });

      let sent = 0;
      let failed = 0;
      const failedSubscriptions: string[] = [];

      // Send to all subscriptions
      for (const subscription of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key
            }
          };

          await webpush.sendNotification(pushSubscription, notificationPayload);
          sent++;
        } catch (error: any) {
          console.error(`Failed to send push notification to subscription ${subscription.id}:`, error);
          failed++;
          failedSubscriptions.push(subscription.id);

          // If subscription is invalid (410 Gone), mark as inactive
          if (error.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', subscription.id);
          }
        }
      }

      // Clean up failed subscriptions
      if (failedSubscriptions.length > 0) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false })
          .in('id', failedSubscriptions);
      }

      return { sent, failed };
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification to a client (by client ID)
   */
  async sendPushToClient(
    clientId: string,
    payload: PushNotificationPayload
  ): Promise<{ sent: number; failed: number }> {
    try {
      // Get notification user for client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('notification_user_id')
        .eq('id', clientId)
        .eq('push_notifications_enabled', true)
        .single();

      if (clientError || !client || !client.notification_user_id) {
        console.log(`No notification user found for client ${clientId}`);
        return { sent: 0, failed: 0 };
      }

      return await this.sendPushNotification(client.notification_user_id, payload);
    } catch (error) {
      console.error('Error sending push to client:', error);
      throw error;
    }
  }

  /**
   * Send push notification to all members of a client group
   */
  async sendPushToGroupMembers(
    clientGroupId: string,
    payload: PushNotificationPayload
  ): Promise<{ sent: number; failed: number; totalClients: number }> {
    try {
      // Get all clients in the group
      const { data: memberships, error: membershipsError } = await supabase
        .from('client_group_memberships')
        .select('client_id')
        .eq('client_group_id', clientGroupId);

      if (membershipsError || !memberships || memberships.length === 0) {
        console.log(`No members found for client group ${clientGroupId}`);
        return { sent: 0, failed: 0, totalClients: 0 };
      }

      const clientIds = memberships.map(m => m.client_id);
      let totalSent = 0;
      let totalFailed = 0;

      // Send to each client
      for (const clientId of clientIds) {
        const result = await this.sendPushToClient(clientId, payload);
        totalSent += result.sent;
        totalFailed += result.failed;
      }

      return {
        sent: totalSent,
        failed: totalFailed,
        totalClients: clientIds.length
      };
    } catch (error) {
      console.error('Error sending push to group members:', error);
      throw error;
    }
  }
}

export const pushNotificationService = new PushNotificationService();

