import { WebSocketMessage } from '../hooks/useWebSocket';

type MessageCallback = (message: WebSocketMessage) => void;
type ConnectCallback = () => void;
type DisconnectCallback = () => void;
type ErrorCallback = (error: Event) => void;

interface Subscriber {
  id: string;
  onMessage?: MessageCallback;
  onConnect?: ConnectCallback;
  onDisconnect?: DisconnectCallback;
  onError?: ErrorCallback;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Subscriber> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private isConnecting = false;
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private user: { user_id: string; email: string } | null = null;
  private token: string | null = null;

  async connect(user: { user_id: string; email: string }, token: string) {
    this.user = user;
    this.token = token;

    // If already connected or connecting, don't create a new connection
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      if (import.meta.env.DEV) {
        console.log('🔌 [WebSocketService] Connection already exists, skipping');
      }
      return;
    }

    if (this.isConnecting) {
      if (import.meta.env.DEV) {
        console.log('🔌 [WebSocketService] Already connecting, skipping');
      }
      return;
    }

    this.isConnecting = true;
    this.connectionStatus = 'connecting';

    // Get the WebSocket URL from backend API URL (not the frontend dev server)
    let apiBaseUrl = import.meta.env.VITE_API_URL;
    if (!apiBaseUrl) {
      const currentHost = window.location.hostname;
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        apiBaseUrl = 'http://localhost:8081';
      } else {
        apiBaseUrl = `http://${currentHost}:8081`;
      }
    }
    const apiUrl = new URL(apiBaseUrl);
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = apiUrl.hostname;
    const includePort = host === 'localhost' || host === '127.0.0.1';
    const port = includePort ? (apiUrl.port || (protocol === 'wss:' ? '443' : '8081')) : '';
    const portString = port ? `:${port}` : '';
    const wsUrl = `${protocol}//${host}${portString}/ws?token=${token}`;

    if (import.meta.env.DEV) {
      console.log('🔌 [WebSocketService] Attempting connection to:', wsUrl.replace(/token=[^&]+/, 'token=***'));
    }

    try {
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          if (import.meta.env.DEV) {
            console.warn('⏱️ [WebSocketService] Connection timeout');
          }
          ws.close();
          this.connectionStatus = 'error';
          this.isConnecting = false;
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        if (import.meta.env.DEV) {
          console.log('✅ [WebSocketService] Connected successfully');
        }
        this.connectionStatus = 'connected';
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.notifySubscribers('connect');
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (import.meta.env.DEV && (message.type === 'trip_created' || message.type === 'trip_update')) {
            console.log('📨 [WebSocketService] Message received:', message.type, {
              subscriberCount: this.subscribers.size
            });
          }
          this.notifySubscribers('message', message);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('❌ [WebSocketService] Error parsing message:', error);
          }
        }
      };

      ws.onerror = (error) => {
        if (import.meta.env.DEV) {
          console.error('❌ [WebSocketService] WebSocket error:', error);
        }
        this.connectionStatus = 'error';
        this.notifySubscribers('error', error);
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        this.ws = null;
        this.isConnecting = false;
        this.connectionStatus = 'disconnected';
        this.notifySubscribers('disconnect');

        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          if (import.meta.env.DEV) {
            console.log(`🔄 [WebSocketService] Reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          }
          this.reconnectTimeout = setTimeout(() => {
            if (this.user && this.token) {
              this.connect(this.user, this.token);
            }
          }, this.reconnectInterval);
        }
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ [WebSocketService] Error creating connection:', error);
      }
      this.connectionStatus = 'error';
      this.isConnecting = false;
      this.notifySubscribers('error', error as Event);
    }
  }

  subscribe(id: string, callbacks: {
    onMessage?: MessageCallback;
    onConnect?: ConnectCallback;
    onDisconnect?: DisconnectCallback;
    onError?: ErrorCallback;
  }) {
    this.subscribers.set(id, { id, ...callbacks });
    if (import.meta.env.DEV) {
      console.log(`📝 [WebSocketService] Subscriber added: ${id} (total: ${this.subscribers.size})`);
    }
  }

  unsubscribe(id: string) {
    this.subscribers.delete(id);
    if (import.meta.env.DEV) {
      console.log(`📝 [WebSocketService] Subscriber removed: ${id} (total: ${this.subscribers.size})`);
    }
  }

  private notifySubscribers(type: 'message', message: WebSocketMessage): void;
  private notifySubscribers(type: 'connect' | 'disconnect'): void;
  private notifySubscribers(type: 'error', error: Event): void;
  private notifySubscribers(
    type: 'message' | 'connect' | 'disconnect' | 'error',
    data?: WebSocketMessage | Event
  ) {
    this.subscribers.forEach((subscriber) => {
      try {
        if (type === 'message' && subscriber.onMessage && data) {
          subscriber.onMessage(data as WebSocketMessage);
        } else if (type === 'connect' && subscriber.onConnect) {
          subscriber.onConnect();
        } else if (type === 'disconnect' && subscriber.onDisconnect) {
          subscriber.onDisconnect();
        } else if (type === 'error' && subscriber.onError && data) {
          subscriber.onError(data as Event);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`❌ [WebSocketService] Error in subscriber ${subscriber.id} callback:`, error);
        }
      }
    });
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.subscribers.clear();
    this.connectionStatus = 'disconnected';
  }

  getConnectionStatus() {
    return this.connectionStatus;
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();





