import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useHierarchy } from './useHierarchy';

export interface WebSocketMessage {
  type: 'trip_update' | 'driver_update' | 'client_update' | 'system_update' | 'connection';
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
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const connect = useCallback(() => {
    if (!enabled || !user?.auth_user_id) {
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    setConnectionStatus('connecting');

    // Get the WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || (protocol === 'wss:' ? '443' : '8081');
    const wsUrl = `${protocol}//${host}:${port}/ws?token=${user.auth_user_id}`;

    console.log('🔌 Connecting to WebSocket:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);
          onMessage?.(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onDisconnect?.();

        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})...`);
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
        onError?.(error);
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [enabled, user?.auth_user_id, reconnectInterval, maxReconnectAttempts, onConnect, onDisconnect, onError, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Connect when user is available and enabled
  useEffect(() => {
    if (enabled && user?.auth_user_id) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, user?.auth_user_id, connect, disconnect]);

  // Reconnect when hierarchy changes (user switches programs/corporate clients)
  useEffect(() => {
    if (isConnected && user?.auth_user_id) {
      // Send hierarchy update to server
      sendMessage({
        type: 'hierarchy_update',
        data: {
          level,
          selectedProgram,
          selectedCorporateClient
        },
        timestamp: new Date().toISOString()
      });
    }
  }, [level, selectedProgram, selectedCorporateClient, isConnected, sendMessage]);

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
        (subscriptionType === 'trips' && message.type === 'trip_update') ||
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




