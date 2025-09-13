// Comprehensive notification service for trip lifecycle management
// Handles: User creates trip → Driver notification → Driver confirms → Status updates → Completion notifications

interface NotificationData {
  id: string;
  recipientId: string;
  recipientType: 'driver' | 'user' | 'dispatcher' | 'admin';
  tripId: string;
  organizationId: string;
  type: 'trip_assigned' | 'trip_confirmed' | 'trip_started' | 'trip_completed' | 'trip_cancelled' | 'status_update';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  read: boolean;
  acknowledged: boolean;
}

interface TripStatusNotification {
  tripId: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  previousStatus?: string;
  driverId?: string;
  userId?: string;
  organizationId: string;
  timestamp: string;
  location?: { latitude: number; longitude: number };
  notes?: string;
}

class NotificationService {
  private notifications: Map<string, NotificationData[]> = new Map();
  private subscribers: Map<string, ((notification: NotificationData) => void)[]> = new Map();

  // Subscribe to notifications for a specific user
  subscribe(userId: string, callback: (notification: NotificationData) => void) {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, []);
    }
    this.subscribers.get(userId)!.push(callback);
  }

  // Unsubscribe from notifications
  unsubscribe(userId: string, callback: (notification: NotificationData) => void) {
    const userSubscribers = this.subscribers.get(userId);
    if (userSubscribers) {
      const index = userSubscribers.indexOf(callback);
      if (index > -1) {
        userSubscribers.splice(index, 1);
      }
    }
  }

  // Send notification to specific user
  private async sendNotification(notification: NotificationData) {
    // Store notification
    if (!this.notifications.has(notification.recipientId)) {
      this.notifications.set(notification.recipientId, []);
    }
    this.notifications.get(notification.recipientId)!.push(notification);

    // Notify subscribers (for real-time updates)
    const userSubscribers = this.subscribers.get(notification.recipientId);
    if (userSubscribers) {
      userSubscribers.forEach(callback => callback(notification));
    }

    console.log(`📢 Notification sent to ${notification.recipientType} ${notification.recipientId}: ${notification.title}`);
  }

  // Get notifications for a user
  getNotifications(userId: string): NotificationData[] {
    return this.notifications.get(userId) || [];
  }

  // Mark notification as read
  markAsRead(userId: string, notificationId: string) {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      const notification = userNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    }
  }

  // Mark notification as acknowledged
  markAsAcknowledged(userId: string, notificationId: string) {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      const notification = userNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.acknowledged = true;
      }
    }
  }

  // Handle trip lifecycle notifications
  async handleTripStatusChange(statusData: TripStatusNotification) {
    const { tripId, status, previousStatus, driverId, userId, organizationId, timestamp, location, notes } = statusData;

    switch (status) {
      case 'scheduled':
        // When user creates/schedules a trip, notify assigned driver
        if (driverId) {
          await this.sendNotification({
            id: `trip_assigned_${tripId}_${Date.now()}`,
            recipientId: driverId,
            recipientType: 'driver',
            tripId,
            organizationId,
            type: 'trip_assigned',
            title: 'New Trip Assignment',
            message: `You have been assigned a new trip. Please confirm your availability.`,
            data: { tripId, scheduledTime: timestamp, location },
            timestamp,
            read: false,
            acknowledged: false
          });
        }
        break;

      case 'confirmed':
        // When driver confirms, notify the user who created the trip
        if (userId && driverId) {
          await this.sendNotification({
            id: `trip_confirmed_${tripId}_${Date.now()}`,
            recipientId: userId,
            recipientType: 'user',
            tripId,
            organizationId,
            type: 'trip_confirmed',
            title: 'Trip Confirmed',
            message: `Your trip has been confirmed by the driver. The driver is ready for pickup.`,
            data: { tripId, driverId, confirmedAt: timestamp },
            timestamp,
            read: false,
            acknowledged: false
          });

          // Also notify dispatchers
          await this.notifyDispatchers(organizationId, {
            id: `dispatch_trip_confirmed_${tripId}_${Date.now()}`,
            recipientType: 'dispatcher',
            tripId,
            organizationId,
            type: 'trip_confirmed',
            title: 'Trip Confirmed',
            message: `Driver has confirmed trip ${tripId}`,
            data: { tripId, driverId, status: 'confirmed' },
            timestamp,
            read: false,
            acknowledged: false
          });
        }
        break;

      case 'in_progress':
        // When driver starts trip, notify user and dispatchers
        if (userId) {
          await this.sendNotification({
            id: `trip_started_${tripId}_${Date.now()}`,
            recipientId: userId,
            recipientType: 'user',
            tripId,
            organizationId,
            type: 'trip_started',
            title: 'Trip Started',
            message: `Your driver is on the way. Trip is now in progress.`,
            data: { tripId, driverId, startedAt: timestamp, location },
            timestamp,
            read: false,
            acknowledged: false
          });
        }

        await this.notifyDispatchers(organizationId, {
          id: `dispatch_trip_started_${tripId}_${Date.now()}`,
          recipientType: 'dispatcher',
          tripId,
          organizationId,
          type: 'trip_started',
          title: 'Trip In Progress',
          message: `Trip ${tripId} has started`,
          data: { tripId, driverId, status: 'in_progress', location },
          timestamp,
          read: false,
          acknowledged: false
        });
        break;

      case 'completed':
        // When driver completes trip, notify user and dispatchers
        if (userId) {
          await this.sendNotification({
            id: `trip_completed_${tripId}_${Date.now()}`,
            recipientId: userId,
            recipientType: 'user',
            tripId,
            organizationId,
            type: 'trip_completed',
            title: 'Trip Completed',
            message: `Your trip has been completed successfully. Thank you for using our service.`,
            data: { tripId, driverId, completedAt: timestamp, location },
            timestamp,
            read: false,
            acknowledged: false
          });
        }

        await this.notifyDispatchers(organizationId, {
          id: `dispatch_trip_completed_${tripId}_${Date.now()}`,
          recipientType: 'dispatcher',
          tripId,
          organizationId,
          type: 'trip_completed',
          title: 'Trip Completed',
          message: `Trip ${tripId} has been completed`,
          data: { tripId, driverId, status: 'completed', location },
          timestamp,
          read: false,
          acknowledged: false
        });
        break;

      case 'cancelled':
        // When trip is cancelled, notify all relevant parties
        const cancelledBy = driverId ? 'Driver' : 'User';
        
        if (userId && driverId) {
          const recipientId = driverId ? userId : driverId; // Notify the other party
          await this.sendNotification({
            id: `trip_cancelled_${tripId}_${Date.now()}`,
            recipientId: recipientId!,
            recipientType: driverId ? 'user' : 'driver',
            tripId,
            organizationId,
            type: 'trip_cancelled',
            title: 'Trip Cancelled',
            message: `Trip has been cancelled by ${cancelledBy}. ${notes || 'No additional details provided.'}`,
            data: { tripId, cancelledBy, cancelledAt: timestamp, reason: notes },
            timestamp,
            read: false,
            acknowledged: false
          });
        }

        await this.notifyDispatchers(organizationId, {
          id: `dispatch_trip_cancelled_${tripId}_${Date.now()}`,
          recipientType: 'dispatcher',
          tripId,
          organizationId,
          type: 'trip_cancelled',
          title: 'Trip Cancelled',
          message: `Trip ${tripId} has been cancelled by ${cancelledBy}`,
          data: { tripId, status: 'cancelled', cancelledBy, reason: notes },
          timestamp,
          read: false,
          acknowledged: false
        });
        break;
    }
  }

  // Notify all dispatchers for an organization
  private async notifyDispatchers(organizationId: string, baseNotification: Omit<NotificationData, 'recipientId'>) {
    // In a real system, you'd query for dispatchers by organization
    // For now, we'll simulate dispatcher notifications
    const dispatcherIds = [`dispatcher_${organizationId}`, 'super_admin_dispatcher'];
    
    for (const dispatcherId of dispatcherIds) {
      await this.sendNotification({
        ...baseNotification,
        recipientId: dispatcherId
      });
    }
  }

  // Handle driver confirmation of trip assignment
  async confirmTripAssignment(tripId: string, driverId: string, organizationId: string) {
    await this.handleTripStatusChange({
      tripId,
      status: 'confirmed',
      driverId,
      organizationId,
      timestamp: new Date().toISOString()
    });
  }

  // Get unread notification count
  getUnreadCount(userId: string): number {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter(n => !n.read).length;
  }

  // Get notifications by type
  getNotificationsByType(userId: string, type: NotificationData['type']): NotificationData[] {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter(n => n.type === type);
  }

  // Clear old notifications (cleanup)
  clearOldNotifications(userId: string, olderThanDays: number = 30) {
    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const filtered = userNotifications.filter(n => {
        return new Date(n.timestamp) > cutoffDate;
      });
      
      this.notifications.set(userId, filtered);
    }
  }
}

export const notificationService = new NotificationService();

// Notification formatting helpers
export class NotificationFormatter {
  static formatTripNotification(notification: NotificationData): string {
    switch (notification.type) {
      case 'trip_assigned':
        return `📅 New trip assigned for ${new Date(notification.data?.scheduledTime).toLocaleDateString()}`;
      case 'trip_confirmed':
        return `✅ Trip confirmed and ready`;
      case 'trip_started':
        return `🚗 Trip in progress`;
      case 'trip_completed':
        return `🏁 Trip completed successfully`;
      case 'trip_cancelled':
        return `❌ Trip cancelled`;
      default:
        return notification.message;
    }
  }

  static getNotificationIcon(type: NotificationData['type']): string {
    switch (type) {
      case 'trip_assigned': return '📅';
      case 'trip_confirmed': return '✅';
      case 'trip_started': return '🚗';
      case 'trip_completed': return '🏁';
      case 'trip_cancelled': return '❌';
      default: return '📢';
    }
  }

  static getNotificationColor(type: NotificationData['type']): string {
    switch (type) {
      case 'trip_assigned': return 'bg-blue-500';
      case 'trip_confirmed': return 'bg-green-500';
      case 'trip_started': return 'bg-yellow-500';
      case 'trip_completed': return 'bg-green-600';
      case 'trip_cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }
}