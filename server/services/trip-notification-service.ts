/**
 * Trip Notification Service
 * 
 * Handles notifications for trip orders, confirmations, declines, and status updates
 * Respects user notification preferences and sends to tagged users
 * Sends notifications via push, notification table, activity log, and WebSocket
 */
import { supabase } from '../db';
import { pushNotificationService } from './push-notification-service';
import { broadcastTripUpdate } from '../websocket-instance';

export interface TripNotificationOptions {
  tripId: string;
  trip: any;
  notificationType: 
    | 'order_confirmed' 
    | 'order_declined' 
    | 'trip_started' 
    | 'client_onboard' 
    | 'client_dropoff' 
    | 'trip_completed' 
    | 'no_show' 
    | 'wait_time_started' 
    | 'wait_time_stopped';
  driverName?: string;
  clientName?: string;
  additionalInfo?: string;
}

class TripNotificationService {
  /**
   * Get users who should receive notifications for a trip
   * Includes trip creator and tagged users
   */
  async getNotificationRecipients(tripId: string): Promise<string[]> {
    const recipients: string[] = [];

    // Get trip to find creator
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('created_by')
      .eq('id', tripId)
      .single();

    if (!tripError && trip?.created_by) {
      recipients.push(trip.created_by);
    }

    // Get tagged users
    const { data: tags, error: tagsError } = await supabase
      .from('trip_notification_tags')
      .select('user_id')
      .eq('trip_id', tripId);

    if (!tagsError && tags) {
      for (const tag of tags) {
        if (!recipients.includes(tag.user_id)) {
          recipients.push(tag.user_id);
        }
      }
    }

    return recipients;
  }

  /**
   * Check if user wants to receive a specific notification type
   */
  async shouldSendNotification(userId: string, notificationType: string): Promise<boolean> {
    // Get user preferences
    const { data: preferences, error } = await supabase
      .from('user_notification_preferences')
      .select('trip_status_updates')
      .eq('user_id', userId)
      .single();

    if (error || !preferences) {
      // No preferences found - use defaults (all enabled except optional events)
      const defaultEnabled = [
        'order_confirmed',
        'order_declined',
        'trip_started',
        'trip_completed',
        'no_show'
      ];
      return defaultEnabled.includes(notificationType);
    }

    // Check preference for this notification type
    const updates = preferences.trip_status_updates as Record<string, boolean>;
    return updates[notificationType] === true;
  }

  /**
   * Send trip notification to all recipients
   * Sends via push notification, notification table, activity log, and WebSocket
   */
  async sendTripNotification(options: TripNotificationOptions): Promise<void> {
    try {
      const recipients = await this.getNotificationRecipients(options.tripId);
      
      // Build notification payload
      const { title, body, data } = this.buildNotificationPayload(options);

      // Get trip creator for activity log
      const { data: tripData } = await supabase
        .from('trips')
        .select('created_by, program_id, corporate_client_id')
        .eq('id', options.tripId)
        .single();

      const tripCreatorId = tripData?.created_by;
      const programId = options.trip.program_id || tripData?.program_id;
      const corporateClientId = options.trip.corporate_client_id || tripData?.corporate_client_id;

      // Import services
      const { createActivityLogEntry } = await import('./activityLogService');
      const { notificationSystem } = await import('../notification-system');

      // Get all tagged users for activity log (only need to fetch once)
      const { data: tags } = await supabase
        .from('trip_notification_tags')
        .select('user_id')
        .eq('trip_id', options.tripId);
      
      const taggedUserIds = tags?.map(t => t.user_id) || [];
      let activityLogCreated = false; // Track if we've created the activity log entry

      // Send to each recipient (respecting preferences)
      for (const userId of recipients) {
        const shouldSend = await this.shouldSendNotification(userId, options.notificationType);
        
        if (shouldSend) {
          try {
            // 1. Send push notification
            await pushNotificationService.sendPushNotification(userId, {
              title,
              body,
              data: {
                ...data,
                userId,
                notificationType: options.notificationType
              },
              tag: `trip-${options.tripId}-${options.notificationType}`,
              requireInteraction: options.notificationType === 'order_declined' || options.notificationType === 'order_confirmed'
            });

            // 2. Create notification entry in notifications table (for bell icon)
            await notificationSystem.createNotification({
              user_id: userId,
              type: options.notificationType,
              title,
              body,
              data: {
                ...data,
                tripId: options.tripId
              },
              priority: this.getNotificationPriority(options.notificationType),
              channels: ['push'],
              status: 'sent'
            });

            // 3. Create activity log entry (for activity feed with "mentioned only" filter)
            // Create one entry per trip update with all tagged users in metadata
            // Only create once, not per recipient
            if (tripCreatorId && taggedUserIds.length > 0 && !activityLogCreated) {
              await createActivityLogEntry({
                activity_type: options.notificationType,
                source_type: 'trip',
                source_id: options.tripId,
                user_id: tripCreatorId, // Creator of the trip
                action_description: body,
                metadata: {
                  mentioned_users: taggedUserIds, // All tagged users
                  trip_id: options.tripId,
                  notification_type: options.notificationType,
                  client_name: options.clientName,
                  driver_name: options.driverName
                },
                corporate_client_id: corporateClientId || null,
                program_id: programId || null
              });
              activityLogCreated = true;
            }

            // 4. Broadcast via WebSocket
            broadcastTripUpdate(options.trip, {
              userId,
              programId: options.trip.program_id
            });

            console.log(`✅ Sent all notification types to user ${userId} for trip ${options.tripId} (${options.notificationType})`);
          } catch (error) {
            console.error(`Error sending notification to user ${userId}:`, error);
            // Continue with other recipients
          }
        }
      }
    } catch (error) {
      console.error('Error in sendTripNotification:', error);
      // Don't throw - notifications are non-critical
    }
  }

  /**
   * Get notification priority based on notification type
   */
  private getNotificationPriority(notificationType: string): 'low' | 'medium' | 'high' | 'urgent' {
    switch (notificationType) {
      case 'order_declined':
      case 'no_show':
        return 'high';
      case 'order_confirmed':
      case 'trip_started':
      case 'trip_completed':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Build notification payload based on notification type
   */
  private buildNotificationPayload(options: TripNotificationOptions): {
    title: string;
    body: string;
    data: any;
  } {
    const { notificationType, trip, driverName, clientName, additionalInfo } = options;
    const tripId = trip.id;
    const tripDate = trip.scheduled_pickup_time 
      ? new Date(trip.scheduled_pickup_time).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : '';

    const tripTime = trip.scheduled_pickup_time
      ? new Date(trip.scheduled_pickup_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        })
      : '';

    switch (notificationType) {
      case 'order_confirmed':
        return {
          title: 'Trip Order Confirmed',
          body: additionalInfo || `${driverName || 'Driver'} has confirmed the trip order for ${clientName || 'client'}${tripDate ? ` on ${tripDate}` : ''}`,
          data: {
            tripId,
            type: 'order_confirmed',
            url: `/trips/${tripId}`
          }
        };

      case 'order_declined':
        return {
          title: 'Trip Order Declined',
          body: additionalInfo || `${driverName || 'Driver'} declined the trip order for ${clientName || 'client'}${tripDate ? ` on ${tripDate}` : ''}. Reason: ${trip.decline_reason || 'Not specified'}`,
          data: {
            tripId,
            type: 'order_declined',
            url: `/trips/${tripId}`
          }
        };

      case 'trip_started':
        return {
          title: 'Trip Started',
          body: `${driverName || 'Driver'} has started the trip for ${clientName || 'client'}`,
          data: {
            tripId,
            type: 'trip_started',
            url: `/trips/${tripId}`
          }
        };

      case 'client_onboard':
        return {
          title: 'Client Picked Up',
          body: `${driverName || 'Driver'} has picked up ${clientName || 'client'}`,
          data: {
            tripId,
            type: 'client_onboard',
            url: `/trips/${tripId}`
          }
        };

      case 'client_dropoff':
        return {
          title: 'Client Dropped Off',
          body: `${clientName || 'Client'} has been dropped off at appointment`,
          data: {
            tripId,
            type: 'client_dropoff',
            url: `/trips/${tripId}`
          }
        };

      case 'trip_completed':
        return {
          title: 'Trip Completed',
          body: `Trip for ${clientName || 'client'} has been completed`,
          data: {
            tripId,
            type: 'trip_completed',
            url: `/trips/${tripId}`
          }
        };

      case 'no_show':
        return {
          title: 'Client No Show',
          body: `${clientName || 'Client'} did not show up for the trip${tripDate ? ` on ${tripDate}` : ''}`,
          data: {
            tripId,
            type: 'no_show',
            url: `/trips/${tripId}`
          }
        };

      case 'wait_time_started':
        return {
          title: 'Wait Time Started',
          body: `Driver is waiting for ${clientName || 'client'} at appointment`,
          data: {
            tripId,
            type: 'wait_time_started',
            url: `/trips/${tripId}`
          }
        };

      case 'wait_time_stopped':
        return {
          title: 'Wait Time Ended',
          body: `${clientName || 'Client'} is ready for return trip`,
          data: {
            tripId,
            type: 'wait_time_stopped',
            url: `/trips/${tripId}`
          }
        };

      default:
        return {
          title: 'Trip Update',
          body: `Trip status has been updated`,
          data: {
            tripId,
            type: notificationType,
            url: `/trips/${tripId}`
          }
        };
    }
  }

  /**
   * Send notification to super admins (for declined orders)
   */
  async notifySuperAdmins(options: TripNotificationOptions): Promise<void> {
    try {
      const { data: superAdmins, error } = await supabase
        .from('users')
        .select('user_id')
        .eq('role', 'super_admin')
        .eq('is_active', true);

      if (error || !superAdmins) {
        console.error('Error fetching super admins:', error);
        return;
      }

      const { title, body, data } = this.buildNotificationPayload(options);

      for (const admin of superAdmins) {
        try {
          await pushNotificationService.sendPushNotification(admin.user_id, {
            title,
            body,
            data: {
              ...data,
              userId: admin.user_id,
              notificationType: options.notificationType
            },
            tag: `trip-${options.tripId}-admin-${options.notificationType}`,
            requireInteraction: true
          });
        } catch (error) {
          console.error(`Error sending notification to super admin ${admin.user_id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in notifySuperAdmins:', error);
    }
  }
}

export const tripNotificationService = new TripNotificationService();

