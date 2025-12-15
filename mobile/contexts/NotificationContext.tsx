import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { notificationService, NotificationData } from '../services/notifications';
import { webSocketService } from '../services/websocket';
import { useQueryClient } from '@tanstack/react-query';

interface NotificationContextType {
  isConnected: boolean;
  connectionState: string;
  notifications: NotificationData[];
  clearNotifications: () => void;
  markAsRead: (id: string) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('CLOSED');
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const notificationIdCounter = useRef(0);

  useEffect(() => {
    // Initialize notifications
    const initNotifications = async () => {
      await notificationService.initialize();
    };

    initNotifications();
  }, []);

  useEffect(() => {
    if (!user) {
      // Disconnect when user logs out
      webSocketService.disconnect();
      setIsConnected(false);
      setConnectionState('CLOSED');
      return;
    }

    // Connect to WebSocket when user is logged in
    const connectWebSocket = async () => {
      await webSocketService.connect({
        onConnect: () => {
          console.log('✅ WebSocket connected for notifications');
          setIsConnected(true);
          setConnectionState('OPEN');
        },
        onDisconnect: () => {
          console.log('🔌 WebSocket disconnected');
          setIsConnected(false);
          setConnectionState('CLOSED');
        },
        onError: (error) => {
          console.error('❌ WebSocket error:', error);
          setIsConnected(false);
          setConnectionState('ERROR');
        },
        onTripUpdate: (data) => {
          console.log('📨 Trip update received:', data);
          handleTripUpdate(data);
        },
        onNewTrip: (data) => {
          console.log('📨 New trip received in NotificationContext:', data);
          console.log('📨 Data keys:', data ? Object.keys(data) : 'no data');
          console.log('📨 Trip ID:', data?.tripId || data?.id);
          console.log('📨 Client Name:', data?.clientName || data?.client_name);
          handleNewTrip(data);
        },
        onEmergency: (data) => {
          console.log('🚨 Emergency notification received:', data);
          handleEmergency(data);
        },
        onSystemMessage: (data) => {
          console.log('📨 System message received:', data);
          handleSystemMessage(data);
        },
      });
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, [user]);

  const handleTripUpdate = (data: any) => {
    // Determine priority based on notification type and status
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    if (data.type === 'emergency') {
      priority = 'urgent';
    } else if (data.status === 'cancelled' || data.status === 'no_show') {
      priority = 'high';
    } else if (data.action === 'assignment') {
      priority = 'high';
    }

    // Extract client name from various possible sources
    // Handle both array and object formats for clients
    let clientName: string | null = null;
    
    if (data.clientName) {
      clientName = data.clientName;
    } else if (data.client_name) {
      clientName = data.client_name;
    } else if (data.clients) {
      // Handle array format
      const client = Array.isArray(data.clients) ? data.clients[0] : data.clients;
      if (client?.first_name || client?.last_name) {
        clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim();
      }
    }
    
    // Try client groups if no individual client found
    if (!clientName && (data.client_groups || data.client_group_name)) {
      const group = Array.isArray(data.client_groups) ? data.client_groups[0] : data.client_groups;
      clientName = group?.name || data.client_group_name || null;
    }
    
    // Final fallback
    if (!clientName) {
      clientName = 'Unknown Client';
    }

    // Build notification body with client name
    let notificationBody = data.notificationMessage || `Trip ${data.status?.replace('_', ' ')}`;
    // If notificationMessage doesn't already include client name, add it
    if (clientName && clientName !== 'Unknown Client' && !notificationBody.includes(clientName)) {
      notificationBody = `${notificationBody} for ${clientName}`;
    } else if (clientName === 'Unknown Client') {
      notificationBody = `${notificationBody}`;
    }

    const notification: NotificationData = {
      type: 'trip_update',
      tripId: data.tripId || data.id,
      title: data.notificationTitle || `Trip ${data.status?.replace('_', ' ').toUpperCase()}`,
      body: notificationBody,
      priority,
      author: data.updatedBy ? {
        userId: data.updatedBy,
        name: data.driverName,
        role: data.updatedByRole,
      } : undefined,
      data: {
        ...data,
        clientName, // Ensure clientName is in data for consistency
      },
    };

    addNotification(notification);
    
    // Show local notification
    notificationService.showTripUpdateNotification(
      data.tripId,
      data.status,
      data.clientName
    );

    // Refresh trips data
    queryClient.invalidateQueries({ queryKey: ['driver-trips'] });
  };

  const handleNewTrip = (data: any) => {
    // Extract client name from various possible sources
    // Handle both array and object formats for clients
    let clientName: string | null = null;
    
    if (data.clientName) {
      clientName = data.clientName;
    } else if (data.client_name) {
      clientName = data.client_name;
    } else if (data.clients) {
      // Handle array format
      const client = Array.isArray(data.clients) ? data.clients[0] : data.clients;
      if (client?.first_name || client?.last_name) {
        clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim();
      }
    }
    
    // Try client groups if no individual client found
    if (!clientName && (data.client_groups || data.client_group_name)) {
      const group = Array.isArray(data.client_groups) ? data.client_groups[0] : data.client_groups;
      clientName = group?.name || data.client_group_name || null;
    }
    
    // Final fallback
    if (!clientName) {
      clientName = 'Unknown Client';
    }
    
    const notification: NotificationData = {
      type: 'new_trip',
      tripId: data.tripId || data.id,
      title: 'New Trip Assigned',
      body: `You have a new trip for ${clientName}${data.pickupTime ? ` at ${new Date(data.pickupTime).toLocaleTimeString()}` : ''}`,
      priority: 'high', // New trip assignments are high priority
      author: data.target?.userId ? {
        userId: data.target.userId,
        role: data.target.role,
      } : undefined,
      data: {
        ...data,
        clientName, // Ensure clientName is in data for consistency
      },
    };

    addNotification(notification);
    
    // Show local notification
    notificationService.showNewTripNotification(
      data.tripId,
      data.clientName,
      data.pickupTime
    );

    // Refresh trips data
    queryClient.invalidateQueries({ queryKey: ['driver-trips'] });
  };

  const handleEmergency = (data: any) => {
    const notification: NotificationData = {
      type: 'emergency',
      tripId: data.tripId || data.id,
      title: '🚨 EMERGENCY ALERT',
      body: data.message || 'Emergency situation detected',
      priority: 'urgent',
      author: data.updatedBy ? {
        userId: data.updatedBy,
        name: data.driverName,
        role: data.updatedByRole,
      } : undefined,
      data,
    };

    addNotification(notification);
    
    // Show emergency notification
    notificationService.showEmergencyNotification(
      data.tripId,
      data.message || 'Emergency situation detected'
    );

    // Show alert for emergency
    Alert.alert(
      '🚨 EMERGENCY ALERT',
      data.message || 'Emergency situation detected',
      [
        { text: 'OK', style: 'destructive' }
      ]
    );
  };

  const handleSystemMessage = (data: any) => {
    const notification: NotificationData = {
      type: 'system',
      title: data.title || 'System Message',
      body: data.message || 'You have a new system message',
      priority: data.priority || 'medium',
      author: data.author ? {
        userId: data.author.userId,
        name: data.author.name,
        role: data.author.role,
      } : {
        name: 'System',
        role: 'system',
      },
      data,
    };

    addNotification(notification);
    
    // Show system notification
    notificationService.showSystemNotification(
      data.title || 'System Message',
      data.message || 'You have a new system message'
    );
  };

  const addNotification = (notification: NotificationData) => {
    const id = `notification_${Date.now()}_${notificationIdCounter.current++}`;
    const notificationWithId = { 
      ...notification, 
      id, 
      timestamp: new Date().toISOString(),
      read: false // Ensure new notifications are marked as unread
    };
    
    // Check for duplicates based on tripId and type to prevent duplicate notifications
    setNotifications(prev => {
      // Check if this notification already exists (same tripId and type within last 5 seconds)
      const isDuplicate = prev.some(n => 
        n.tripId === notification.tripId && 
        n.type === notification.type &&
        n.timestamp && 
        new Date(n.timestamp).getTime() > Date.now() - 5000 // Within last 5 seconds
      );
      
      if (isDuplicate) {
        console.log('⚠️ Duplicate notification detected, skipping:', { tripId: notification.tripId, type: notification.type });
        return prev; // Don't add duplicate
      }
      
      return [notificationWithId, ...prev.slice(0, 49)]; // Keep last 50 notifications
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Update connection state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionState(webSocketService.getConnectionState());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const value: NotificationContextType = {
    isConnected,
    connectionState,
    notifications,
    clearNotifications,
    markAsRead,
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
