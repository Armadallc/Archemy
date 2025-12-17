import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface WebSocketMessage {
  type: 'trip_update' | 'new_trip' | 'trip_created' | 'emergency' | 'system' | 'ping' | 'pong';
  data: any;
  timestamp: string;
}

interface WebSocketCallbacks {
  onTripUpdate?: (data: any) => void;
  onNewTrip?: (data: any) => void;
  onEmergency?: (data: any) => void;
  onSystemMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private callbacks: WebSocketCallbacks = {};
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Use local IP for mobile, localhost for web
    const baseUrl = Platform.OS === 'web' ? 'localhost' : '192.168.12.215';
    this.url = `ws://${baseUrl}:8081/ws`;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem('auth_token');
      } else {
        return await SecureStore.getItemAsync('auth_token');
      }
    } catch (error) {
      console.error('❌ Failed to get auth token:', error);
      return null;
    }
  }

  async connect(callbacks: WebSocketCallbacks = {}) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('⚠️ WebSocket already connected or connecting');
      return;
    }

    this.callbacks = callbacks;
    this.isConnecting = true;

    try {
      // Get auth token
      const token = await this.getAuthToken();
      if (!token) {
        console.log('❌ No auth token available for WebSocket connection');
        this.isConnecting = false;
        this.callbacks.onError?.('No authentication token');
        return;
      }

      // Add token to WebSocket URL
      const urlWithToken = `${this.url}?token=${encodeURIComponent(token)}`;
      console.log('🔌 Connecting to WebSocket:', urlWithToken);
      
      this.ws = new WebSocket(urlWithToken);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.callbacks.onConnect?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.callbacks.onDisconnect?.();
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
        this.callbacks.onError?.(error);
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.callbacks.onError?.(error);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    console.log('📨 WebSocket message received:', message.type);
    console.log('📨 Message data:', JSON.stringify(message.data, null, 2));

    switch (message.type) {
      case 'trip_update':
        console.log('📨 Calling onTripUpdate callback');
        this.callbacks.onTripUpdate?.(message.data);
        break;
      case 'new_trip':
        console.log('📨 Calling onNewTrip callback');
        this.callbacks.onNewTrip?.(message.data);
        break;
      case 'trip_created':
        // Handle legacy 'trip_created' type by treating it as 'new_trip'
        // This ensures backward compatibility if any old messages are still sent
        console.log('📨 Converting trip_created to new_trip for compatibility');
        this.callbacks.onNewTrip?.(message.data);
        break;
      case 'emergency':
        this.callbacks.onEmergency?.(message.data);
        break;
      case 'system':
        this.callbacks.onSystemMessage?.(message.data);
        break;
      case 'connection':
        // Connection confirmation message - just acknowledge
        console.log('✅ WebSocket connection confirmed');
        break;
      case 'pong':
        // Heartbeat response
        break;
      default:
        console.log('⚠️ Unknown message type:', message.type);
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', data: {}, timestamp: new Date().toISOString() });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        this.connect(this.callbacks);
      }
    }, delay);
  }

  send(message: Partial<WebSocketMessage>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        type: message.type || 'system',
        data: message.data || {},
        timestamp: new Date().toISOString(),
      };
      
      this.ws.send(JSON.stringify(fullMessage));
      console.log('📤 WebSocket message sent:', fullMessage.type);
    } else {
      console.log('⚠️ WebSocket not connected, cannot send message');
    }
  }

  disconnect() {
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.reconnectAttempts = 0;
    console.log('🔌 WebSocket disconnected');
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState() {
    if (!this.ws) return 'CLOSED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
}

export const webSocketService = new WebSocketService();
