import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useHierarchy } from './useHierarchy';
import { supabase } from '../lib/supabase';

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
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const connect = useCallback(async () => {
    // WebSocket connections re-enabled for Phase 5 testing
    // TODO: Monitor for connection issues and adjust if needed
    
    if (!enabled || !user?.user_id) {
      if (import.meta.env.DEV) {
        console.log('🔌 WebSocket connection skipped: not enabled or no user');
      }
      return;
    }

    // Prevent multiple simultaneous connection attempts
    // Check if there's an existing connection that's actually active
    if (wsRef.current) {
      const state = wsRef.current.readyState;
      if (state === WebSocket.CONNECTING || state === WebSocket.OPEN) {
        console.log('🔌 WebSocket connection skipped: already connecting or connected, state:', state);
        return;
      }
      // If connection is closed or closing, clean it up before creating a new one
      if (state === WebSocket.CLOSING || state === WebSocket.CLOSED) {
        console.log('🔌 Cleaning up closed WebSocket connection, state:', state);
        try {
          wsRef.current.close();
        } catch (e) {
          // Ignore errors when closing
        }
        wsRef.current = null;
      } else {
        // For any other state, close cleanly
        try {
          wsRef.current.close(1000, 'Reconnecting');
        } catch (e) {
          // Ignore errors when closing
        }
        wsRef.current = null;
      }
    }

    setConnectionStatus('connecting');

    // Get the WebSocket URL from backend API URL
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
    const apiUrl = new URL(apiBaseUrl);
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = apiUrl.hostname;
    // For Render/production, don't include port (uses default ports)
    // For localhost, include port
    const includePort = host === 'localhost' || host === '127.0.0.1';
    const port = includePort ? (apiUrl.port || (protocol === 'wss:' ? '443' : '8081')) : '';
    const portString = port ? `:${port}` : '';
    
    // Use auth_user_id if available (preferred), otherwise get JWT token as fallback
    let token = user.auth_user_id;
    // REDUCED LOGGING: Only log once per connection attempt, not on every call
    if (!token) {
      if (import.meta.env.DEV) {
        console.log('🔍 auth_user_id not available, getting JWT token...');
      }
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          if (import.meta.env.DEV) {
            console.error('❌ Error getting session:', sessionError);
          }
          setConnectionStatus('error');
          return;
        }
        
        if (session?.access_token) {
          token = session.access_token;
          if (import.meta.env.DEV) {
            console.log('✅ Using JWT token for WebSocket authentication');
          }
        } else {
          if (import.meta.env.DEV) {
            console.error('❌ No authentication token available for WebSocket');
          }
          setConnectionStatus('error');
          return;
        }
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
    
    // Construct WebSocket URL
    const wsUrl = `${protocol}//${host}${portString}/ws?token=${token}`;

    // Reduced logging to prevent console spam - only log in development
    if (import.meta.env.DEV) {
      console.log('🔌 Attempting WebSocket connection to:', wsUrl.replace(/token=[^&]+/, 'token=***'));
      console.log('🔌 User:', user.email, 'User ID:', user.user_id);
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      // console.log('🔌 WebSocket instance created, state:', ws.readyState); // Disabled to reduce console spam

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          if (import.meta.env.DEV) {
            console.warn('⏱️ WebSocket connection timeout');
          }
          ws.close();
          setConnectionStatus('error');
        }
      }, 10000); // 10 second timeout

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        // Only log successful connections in development
        if (import.meta.env.DEV) {
          console.log('✅ WebSocket connected successfully');
        }
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          // Reduced logging - only log important message types in development
          if (import.meta.env.DEV && (message.type === 'trip_created' || message.type === 'trip_update')) {
            console.log('📨 WebSocket message received:', message.type);
          }
          // console.log('📨 WebSocket message received:', message.type, message); // Disabled to reduce console spam
          onMessage?.(message);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
      // REDUCED LOGGING: Only log errors, not normal disconnects
        
        // Don't log or attempt reconnect for manual closes
        if (event.code === 1000) {
          // Manual close - normal disconnect
          return;
        }
        
        // Don't spam reconnect attempts for authentication failures
        if (event.code === 1008) {
          if (import.meta.env.DEV) {
            console.warn('⚠️ WebSocket authentication failed (1008). Check your login status and ensure auth_user_id is available.');
          }
          setConnectionStatus('error');
          reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent reconnection
          onDisconnect?.();
          return;
        }
        
        onDisconnect?.();

        // COMPLETELY DISABLED: Stop all reconnection attempts and clear any pending timeouts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        // Don't log anything - completely silent to prevent console spam
        setConnectionStatus('error');
        
        // ALL RECONNECTION CODE DISABLED - Do nothing, just stop
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        // Suppress verbose error logs - onclose will handle the actual error code
        setConnectionStatus('error');
        onError?.(error);
      };

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Error creating WebSocket connection:', error);
      }
      setConnectionStatus('error');
      onError?.(error as Event);
    }
  }, [enabled, user?.user_id, user?.auth_user_id, reconnectInterval, maxReconnectAttempts, onConnect, onDisconnect, onError, onMessage]);

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

  // WebSocket connection effect - re-enabled for Phase 5 testing
  useEffect(() => {
    // Reset reconnect attempts when user changes
    reconnectAttemptsRef.current = 0;
    
    if (enabled && user?.user_id) {
      // Attempt to connect
      connect();
    } else {
      // Disconnect if not enabled or no user
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Clear any existing connections
      if (wsRef.current) {
        try {
          wsRef.current.close(1000);
        } catch (e) {
          // Ignore
        }
        wsRef.current = null;
      }
      
      // Clear any pending timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [enabled, user?.user_id, user?.auth_user_id, connect]);

  // Reconnect when hierarchy changes (user switches programs/corporate clients)
  useEffect(() => {
    if (isConnected && user?.user_id) {
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




