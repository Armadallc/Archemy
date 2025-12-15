import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useHierarchy } from './useHierarchy';
import { supabase } from '../lib/supabase';
import { websocketService } from '../services/websocket-service';

export interface WebSocketMessage {
  type: 'trip_update' | 'trip_created' | 'driver_update' | 'client_update' | 'system_update' | 'connection';
  data: any;
  timestamp: string;
  target?: {
    userId?: string;
    role?: string;
    programId?: string;
    corporateClientId?: string;
  };
}

export interface UseWebSocketOptions {
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    enabled = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  
  const subscriberIdRef = useRef<string>(`websocket-${Math.random().toString(36).substr(2, 9)}`);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const connectionInitializedRef = useRef(false);
  
  // Store callbacks in refs to avoid re-subscribing when they change
  const callbacksRef = useRef({ onMessage, onConnect, onDisconnect, onError });
  useEffect(() => {
    callbacksRef.current = { onMessage, onConnect, onDisconnect, onError };
  }, [onMessage, onConnect, onDisconnect, onError]);

  // Subscribe to messages (this should be stable and not cause re-renders)
  useEffect(() => {
    if (!enabled || !user?.user_id) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      websocketService.unsubscribe(subscriberIdRef.current);
      return;
    }

    // Subscribe to the shared WebSocket service
    websocketService.subscribe(subscriberIdRef.current, {
      onMessage: (message) => {
        if (callbacksRef.current.onMessage) {
          if (import.meta.env.DEV && (message.type === 'trip_created' || message.type === 'trip_update')) {
            console.log(`📨 [${subscriberIdRef.current}] onMessage called for:`, message.type);
          }
          callbacksRef.current.onMessage(message);
        }
      },
      onConnect: () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        callbacksRef.current.onConnect?.();
      },
      onDisconnect: () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        callbacksRef.current.onDisconnect?.();
      },
      onError: (error) => {
        setConnectionStatus('error');
        callbacksRef.current.onError?.(error);
      }
    });

    // Cleanup on unmount
    return () => {
      websocketService.unsubscribe(subscriberIdRef.current);
    };
  }, [enabled, user?.user_id]); // Only depend on enabled and user_id, not callbacks

  // Initialize connection separately (only once per user)
  useEffect(() => {
    if (!enabled || !user?.user_id || connectionInitializedRef.current) {
      return;
    }

    const initializeConnection = async () => {
      // Get authentication token
      let token = user.auth_user_id;
      if (!token) {
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session?.access_token) {
            if (import.meta.env.DEV) {
              console.error('❌ Error getting session for WebSocket:', sessionError);
            }
            setConnectionStatus('error');
            return;
          }
          token = session.access_token;
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('❌ Error fetching session:', error);
          }
          setConnectionStatus('error');
          return;
        }
      }

      if (!token) {
        if (import.meta.env.DEV) {
          console.error('❌ No token available for WebSocket connection');
        }
        setConnectionStatus('error');
        return;
      }

      if (import.meta.env.DEV) {
        console.log(`🔌 [${subscriberIdRef.current}] Initializing WebSocket connection`);
      }

      connectionInitializedRef.current = true;
      await websocketService.connect(user, token);
      
      // Update connection status based on service status
      const status = websocketService.getConnectionStatus();
      setConnectionStatus(status);
      setIsConnected(websocketService.isConnected());
    };

    initializeConnection();

    // Reset initialization flag when user changes
    return () => {
      connectionInitializedRef.current = false;
    };
  }, [enabled, user?.user_id, user?.auth_user_id]); // Only depend on user, not callbacks

  // Sync connection status with service
  useEffect(() => {
    const checkStatus = () => {
      const status = websocketService.getConnectionStatus();
      const connected = websocketService.isConnected();
      setConnectionStatus(status);
      setIsConnected(connected);
    };

    // Check status periodically
    const interval = setInterval(checkStatus, 1000);
    checkStatus(); // Check immediately

    return () => clearInterval(interval);
  }, []);

  const disconnect = useCallback(() => {
    websocketService.unsubscribe(subscriberIdRef.current);
    setIsConnected(false);
    setConnectionStatus('disconnected');
    connectionInitializedRef.current = false;
  }, []);

  const sendMessage = useCallback((message: any) => {
    // Note: The shared service doesn't expose sendMessage yet
    // This would need to be added to the service if needed
    console.warn('sendMessage not yet implemented in shared WebSocket service');
    return false;
  }, []);

  const connect = useCallback(async () => {
    if (!user?.user_id) return;
    
    let token = user.auth_user_id;
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || null;
    }
    
    if (token) {
      connectionInitializedRef.current = false;
      await websocketService.connect(user, token);
    }
  }, [user]);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage
  };
}

// Hook for specific real-time data subscriptions
export function useRealtimeSubscription(
  subscriptionType: 'trips' | 'drivers' | 'clients' | 'all',
  options: UseWebSocketOptions = {}
) {
  const { onMessage, ...wsOptions } = options;

  const handleMessage = useCallback((message: WebSocketMessage) => {
    // Filter messages based on subscription type
    if (subscriptionType === 'all' || 
        (subscriptionType === 'trips' && (message.type === 'trip_update' || message.type === 'trip_created')) ||
        (subscriptionType === 'drivers' && message.type === 'driver_update') ||
        (subscriptionType === 'clients' && message.type === 'client_update')) {
      onMessage?.(message);
    }
  }, [subscriptionType, onMessage]);

  return useWebSocket({
    ...wsOptions,
    onMessage: handleMessage
  });
}
