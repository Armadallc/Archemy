/**
 * Multi-Channel Notification System
 * 
 * Supports push notifications, SMS, and email with user-configurable preferences
 * and permission-based delivery
 */
import { supabase } from './db';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'trip_reminder' | 'driver_update' | 'system_alert' | 'maintenance_reminder' | 'custom';
  channels: ('push' | 'sms' | 'email')[];
  subject?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  push_enabled: boolean;
  sms_enabled: boolean;
  email_enabled: boolean;
  advance_time: number; // minutes
  quiet_hours_start?: string; // HH:MM format
  quiet_hours_end?: string; // HH:MM format
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationDelivery {
  id: string;
  notification_id: string;
  user_id: string;
  channel: 'push' | 'sms' | 'email';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_for?: string;
  channels: ('push' | 'sms' | 'email')[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  deliveries: NotificationDelivery[];
  created_at: string;
  updated_at: string;
}

export const notificationSystem = {
  // Create notification template
  async createTemplate(template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .insert({
          ...template,
          id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification template:', error);
      throw error;
    }
  },

  // Get notification templates
  async getTemplates(type?: string) {
    try {
      let query = supabase
        .from('notification_templates')
        .select('*')
        .eq('is_active', true);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      throw error;
    }
  },

  // Create notification
  async createNotification(notification: Omit<Notification, 'id' | 'deliveries' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Create delivery records for each channel
      await this.createDeliveryRecords(data.id, notification.user_id, notification.channels);

      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  // Create delivery records
  async createDeliveryRecords(notificationId: string, userId: string, channels: ('push' | 'sms' | 'email')[]) {
    try {
      const deliveries = channels.map(channel => ({
        id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        notification_id: notificationId,
        user_id: userId,
        channel,
        status: 'pending',
        retry_count: 0,
        max_retries: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('notification_deliveries')
        .insert(deliveries);

      if (error) throw error;
      return deliveries;
    } catch (error) {
      console.error('Error creating delivery records:', error);
      throw error;
    }
  },

  // Send trip reminder
  async sendTripReminder(tripId: string, advanceMinutes: number = 30) {
    try {
      // Get trip details
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select(`
          *,
          clients:client_id (first_name, last_name, phone, email),
          drivers:driver_id (user_id, users:user_id (user_name, email, phone))
        `)
        .eq('id', tripId)
        .single();

      if (tripError) throw tripError;

      const scheduledTime = new Date(trip.scheduled_pickup_time);
      const reminderTime = new Date(scheduledTime.getTime() - (advanceMinutes * 60 * 1000));

      // Send to driver
      if (trip.driver_id) {
        await this.createNotification({
          user_id: trip.drivers?.user_id || '',
          type: 'trip_reminder',
          title: 'Upcoming Trip',
          body: `You have a trip scheduled for ${scheduledTime.toLocaleString()}`,
          data: {
            trip_id: tripId,
            client_name: `${trip.clients?.first_name || ''} ${trip.clients?.last_name || ''}`.trim(),
            pickup_address: trip.pickup_address,
            dropoff_address: trip.dropoff_address,
            scheduled_time: trip.scheduled_pickup_time
          },
          priority: 'high',
          scheduled_for: reminderTime.toISOString(),
          channels: ['push', 'sms'],
          status: 'scheduled'
        });
      }

      // Send to client
      if (trip.clients?.email) {
        await this.createNotification({
          user_id: trip.client_id,
          type: 'trip_reminder',
          title: 'Trip Reminder',
          body: `Your trip is scheduled for ${scheduledTime.toLocaleString()}`,
          data: {
            trip_id: tripId,
            driver_name: trip.drivers?.users?.user_name || 'TBD',
            pickup_address: trip.pickup_address,
            dropoff_address: trip.dropoff_address,
            scheduled_time: trip.scheduled_pickup_time
          },
          priority: 'medium',
          scheduled_for: reminderTime.toISOString(),
          channels: ['email', 'sms'],
          status: 'scheduled'
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending trip reminder:', error);
      throw error;
    }
  },

  // Send driver update
  async sendDriverUpdate(driverId: string, updateType: string, data: any) {
    try {
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('user_id, users:user_id (user_name, email, phone)')
        .eq('id', driverId)
        .single();

      if (error) throw error;

      let title = 'Driver Update';
      let body = 'You have a driver update';

      switch (updateType) {
        case 'trip_assigned':
          title = 'New Trip Assigned';
          body = `You have been assigned a new trip: ${data.client_name}`;
          break;
        case 'trip_cancelled':
          title = 'Trip Cancelled';
          body = `Trip cancelled: ${data.client_name}`;
          break;
        case 'schedule_change':
          title = 'Schedule Change';
          body = 'Your schedule has been updated';
          break;
        case 'vehicle_assignment':
          title = 'Vehicle Assignment';
          body = `You have been assigned vehicle: ${data.vehicle_info}`;
          break;
      }

      await this.createNotification({
        user_id: driver.user_id,
        type: 'driver_update',
        title,
        body,
        data: {
          update_type: updateType,
          ...data
        },
        priority: 'high',
        channels: ['push', 'sms'],
        status: 'draft' as const
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending driver update:', error);
      throw error;
    }
  },

  // Send system alert
  async sendSystemAlert(alertType: string, message: string, targetUsers?: string[], priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') {
    try {
      let userIds = targetUsers;

      if (!userIds) {
        // Send to all active users
        const { data: users, error } = await supabase
          .from('users')
          .select('user_id')
          .eq('is_active', true);

        if (error) throw error;
        userIds = users.map(u => u.user_id);
      }

      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: 'system_alert' as const,
        title: 'System Alert',
        body: message,
        data: {
          alert_type: alertType,
          timestamp: new Date().toISOString()
        },
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        channels: ['push', 'email'] as ('push' | 'sms' | 'email')[],
        status: 'draft' as const
      }));

      for (const notification of notifications) {
        await this.createNotification(notification);
      }

      return { success: true, sent_to: userIds.length };
    } catch (error) {
      console.error('Error sending system alert:', error);
      throw error;
    }
  },

  // Process scheduled notifications
  async processScheduledNotifications() {
    try {
      const now = new Date().toISOString();
      
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select(`
          *,
          deliveries:notification_deliveries (*)
        `)
        .eq('status', 'scheduled')
        .lte('scheduled_for', now);

      if (error) throw error;

      for (const notification of notifications || []) {
        await this.sendNotification(notification);
      }

      return { processed: notifications?.length || 0 };
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      throw error;
    }
  },

  // Send notification through appropriate channels
  async sendNotification(notification: Notification) {
    try {
      // Update status to sending
      await supabase
        .from('notifications')
        .update({ 
          status: 'sending',
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      // Send through each channel
      for (const delivery of notification.deliveries) {
        if (delivery.status === 'pending') {
          try {
            await this.sendToChannel(delivery, notification);
          } catch (error) {
            console.error(`Error sending to ${delivery.channel}:`, error);
            await this.updateDeliveryStatus(delivery.id, 'failed', error instanceof Error ? error.message : String(error));
          }
        }
      }

      // Update notification status
      await supabase
        .from('notifications')
        .update({ 
          status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      return { success: true };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  // Send to specific channel
  async sendToChannel(delivery: NotificationDelivery, notification: Notification) {
    switch (delivery.channel) {
      case 'push':
        await this.sendPushNotification(delivery, notification);
        break;
      case 'sms':
        await this.sendSMS(delivery, notification);
        break;
      case 'email':
        await this.sendEmail(delivery, notification);
        break;
    }
  },

  // Send push notification
  async sendPushNotification(delivery: NotificationDelivery, notification: Notification) {
    // In a real implementation, this would integrate with FCM, APNS, etc.
    console.log(`Sending push notification to ${delivery.user_id}: ${notification.title}`);
    
    await this.updateDeliveryStatus(delivery.id, 'sent');
    await this.updateDeliveryStatus(delivery.id, 'delivered');
  },

  // Send SMS
  async sendSMS(delivery: NotificationDelivery, notification: Notification) {
    // In a real implementation, this would integrate with Twilio, AWS SNS, etc.
    console.log(`Sending SMS to ${delivery.user_id}: ${notification.body}`);
    
    await this.updateDeliveryStatus(delivery.id, 'sent');
    await this.updateDeliveryStatus(delivery.id, 'delivered');
  },

  // Send email
  async sendEmail(delivery: NotificationDelivery, notification: Notification) {
    // In a real implementation, this would integrate with SendGrid, AWS SES, etc.
    console.log(`Sending email to ${delivery.user_id}: ${notification.title}`);
    
    await this.updateDeliveryStatus(delivery.id, 'sent');
    await this.updateDeliveryStatus(delivery.id, 'delivered');
  },

  // Update delivery status
  async updateDeliveryStatus(deliveryId: string, status: string, errorMessage?: string) {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'sent') {
        updates.sent_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      } else if (status === 'failed') {
        updates.error_message = errorMessage;
        updates.retry_count = await this.incrementRetryCount(deliveryId);
      }

      const { error } = await supabase
        .from('notification_deliveries')
        .update(updates)
        .eq('id', deliveryId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  },

  // Increment retry count
  async incrementRetryCount(deliveryId: string) {
    try {
      const { data, error } = await supabase
        .from('notification_deliveries')
        .select('retry_count')
        .eq('id', deliveryId)
        .single();

      if (error) throw error;
      return (data.retry_count || 0) + 1;
    } catch (error) {
      console.error('Error incrementing retry count:', error);
      return 1;
    }
  },

  // Get user notification preferences
  async getUserPreferences(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw error;
    }
  },

  // Update user notification preferences
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreference>) {
    try {
      const notificationType = preferences.notification_type;
      
      if (!notificationType) {
        throw new Error('notification_type is required');
      }

      // Check if preference exists
      const { data: existing, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('notification_type', notificationType)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Error fetching existing preference:', fetchError);
        throw fetchError;
      }

      console.log('🔍 Existing preference:', existing ? `Found with ID: ${existing.id}` : 'Not found');

      let result;
      if (existing?.id) {
        // Update existing
        const updateData: any = {
          email_enabled: preferences.email_enabled !== undefined ? preferences.email_enabled : existing.email_enabled,
          push_enabled: preferences.push_enabled !== undefined ? preferences.push_enabled : existing.push_enabled,
          sms_enabled: preferences.sms_enabled !== undefined ? preferences.sms_enabled : existing.sms_enabled,
          advance_time: preferences.advance_time ?? existing.advance_time ?? 30,
          quiet_hours_start: preferences.quiet_hours_start ?? existing.quiet_hours_start ?? null,
          quiet_hours_end: preferences.quiet_hours_end ?? existing.quiet_hours_end ?? null,
          timezone: preferences.timezone ?? existing.timezone ?? 'America/New_York',
          updated_at: new Date().toISOString()
        };

        console.log('🔍 Updating existing preference with ID:', existing.id, 'Data:', updateData);

        const { data, error } = await supabase
          .from('notification_preferences')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Update error:', error);
          throw error;
        }
        result = data;
      } else {
        // Create new - generate ID using crypto for better uniqueness
        const crypto = await import('crypto');
        const idSuffix = crypto.randomBytes(8).toString('hex');
        const generatedId = `pref_${userId.substring(0, 15)}_${notificationType.substring(0, 8)}_${idSuffix}`.substring(0, 50);
        
        const insertData: any = {
          id: generatedId,
          user_id: userId,
          notification_type: notificationType,
          email_enabled: preferences.email_enabled ?? true,
          push_enabled: preferences.push_enabled ?? false,
          sms_enabled: preferences.sms_enabled ?? false,
          advance_time: preferences.advance_time ?? 30,
          quiet_hours_start: preferences.quiet_hours_start ?? null,
          quiet_hours_end: preferences.quiet_hours_end ?? null,
          timezone: preferences.timezone ?? 'America/New_York',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Ensure ID is set and valid
        if (!insertData.id || insertData.id.length === 0 || insertData.id.length > 50) {
          throw new Error(`Invalid preference ID: ${insertData.id}`);
        }
        
        console.log('🔍 Creating new notification preference:', {
          id: insertData.id,
          idLength: insertData.id.length,
          user_id: insertData.user_id,
          notification_type: insertData.notification_type
        });
        
        const { data, error } = await supabase
          .from('notification_preferences')
          .insert(insertData)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Insert error:', error);
          console.error('❌ Insert data that failed:', JSON.stringify(insertData, null, 2));
          throw error;
        }
        console.log('✅ Successfully created preference:', data?.id);
        result = data;
      }

      return result;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
};


