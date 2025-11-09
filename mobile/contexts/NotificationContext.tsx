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
          console.log('📨 New trip received:', data);
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
    const notification: NotificationData = {
      type: 'trip_update',
      tripId: data.tripId,
      title: `Trip ${data.status?.replace('_', ' ').toUpperCase()}`,
      body: `Trip for ${data.clientName} has been updated`,
      data,
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
    const notification: NotificationData = {
      type: 'new_trip',
      tripId: data.tripId,
      title: 'New Trip Assigned',
      body: `You have a new trip for ${data.clientName}`,
      data,
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
      tripId: data.tripId,
      title: '🚨 EMERGENCY ALERT',
      body: data.message || 'Emergency situation detected',
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
    const notificationWithId = { ...notification, id, timestamp: new Date().toISOString() };
    
    setNotifications(prev => [notificationWithId, ...prev.slice(0, 49)]); // Keep last 50 notifications
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
