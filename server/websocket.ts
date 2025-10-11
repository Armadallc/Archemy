import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { verifySupabaseToken } from './supabase-auth';

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  role?: string;
  programId?: string;
  corporateClientId?: string;
  isAlive?: boolean;
}

export class RealtimeWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: any) {
    console.log('🔌 Creating WebSocket server...');
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    console.log('🔌 WebSocket server created successfully');
    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private async verifyClient(info: any): Promise<boolean> {
    try {
      console.log('🔍 WebSocket verification started');
      const url = new URL(info.req.url, `http://${info.req.headers.host}`);
      const token = url.searchParams.get('token');
      
      console.log('🔍 Token received:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token) {
        console.log('❌ WebSocket connection rejected: No token provided');
        return false;
      }

      // Check if token is a Supabase JWT or auth_user_id
      let user;
      if (token.startsWith('eyJ')) {
        // It's a Supabase JWT token
        user = await verifySupabaseToken(token);
      } else {
        // It's an auth_user_id, look up user directly
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        const { data: dbUser, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('auth_user_id', token)
          .single();
        
        if (error || !dbUser) {
          console.log('❌ WebSocket connection rejected: User not found');
          return false;
        }

        user = {
          userId: dbUser.user_id,
          email: dbUser.email,
          role: dbUser.role,
          primaryProgramId: dbUser.primary_program_id,
          corporateClientId: dbUser.corporate_client_id
        };
      }

      if (!user) {
        console.log('❌ WebSocket connection rejected: Invalid token');
        return false;
      }

      // Store user info in the request object for later use
      info.req.user = user;
      console.log('✅ WebSocket connection verified for user:', user.email, user.role);
      return true;
    } catch (error) {
      console.error('❌ WebSocket verification error:', error);
      return false;
    }
  }

  private setupEventHandlers() {
    this.wss.on('connection', async (ws: AuthenticatedWebSocket, req: any) => {
      console.log('🔌 WebSocket connection event triggered');
      
      // Try to get user from request first (from verifyClient)
      let user = req.user;
      
      // If no user in request, try to extract token from URL and verify
      if (!user) {
        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const token = url.searchParams.get('token');
          
          if (token) {
            console.log('🔍 Re-verifying token in connection handler...');
            if (token.startsWith('eyJ')) {
              user = await verifySupabaseToken(token);
            } else {
              // Handle auth_user_id case
              const { createClient } = await import('@supabase/supabase-js');
              const supabaseAdmin = createClient(
                process.env.SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
              );
              
              const { data: dbUser, error } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('auth_user_id', token)
                .single();
              
              if (!error && dbUser) {
                user = {
                  userId: dbUser.user_id,
                  email: dbUser.email,
                  role: dbUser.role,
                  primaryProgramId: dbUser.primary_program_id,
                  corporateClientId: dbUser.corporate_client_id
                };
              }
            }
          }
        } catch (error) {
          console.error('❌ Error re-verifying token in connection handler:', error);
        }
      }
      
      if (!user) {
        console.log('❌ WebSocket connection rejected: No user in request');
        ws.close(1008, 'Authentication failed');
        return;
      }

      console.log(`🔌 Setting up WebSocket for user: ${user.email} (${user.role})`);

      // Store user info in WebSocket
      ws.userId = user.userId;
      ws.role = user.role;
      ws.programId = user.primaryProgramId;
      ws.corporateClientId = user.corporateClientId;
      ws.isAlive = true;

      // Store client
      this.clients.set(user.userId, ws);

      console.log(`🔌 WebSocket connected: ${user.email} (${user.role})`);

      // Handle pong responses
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle client disconnect
      ws.on('close', (code, reason) => {
        this.clients.delete(user.userId);
        console.log(`🔌 WebSocket disconnected: ${user.email} (${code}: ${reason})`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for ${user.email}:`, error);
        this.clients.delete(user.userId);
      });

      // Send welcome message
      try {
        ws.send(JSON.stringify({
          type: 'connection',
          message: 'Connected to real-time updates',
          timestamp: new Date().toISOString()
        }));
        console.log(`📨 Welcome message sent to ${user.email}`);
      } catch (error) {
        console.error(`❌ Error sending welcome message to ${user.email}:`, error);
      }
    });
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (!ws.isAlive) {
          console.log('💀 Removing dead WebSocket connection');
          ws.terminate();
          this.clients.delete(ws.userId!);
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  // Broadcast to all clients
  public broadcast(data: any) {
    const message = JSON.stringify(data);
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  // Broadcast to specific user
  public sendToUser(userId: string, data: any) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Broadcast to users by role
  public broadcastToRole(role: string, data: any) {
    const message = JSON.stringify(data);
    this.clients.forEach((ws) => {
      if (ws.role === role && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  // Broadcast to users by program
  public broadcastToProgram(programId: string, data: any) {
    const message = JSON.stringify(data);
    this.clients.forEach((ws) => {
      if (ws.programId === programId && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  // Broadcast to users by corporate client
  public broadcastToCorporateClient(corporateClientId: string, data: any) {
    const message = JSON.stringify(data);
    this.clients.forEach((ws) => {
      if (ws.corporateClientId === corporateClientId && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  // Get connected clients info
  public getConnectedClients() {
    return Array.from(this.clients.values()).map(ws => ({
      userId: ws.userId,
      role: ws.role,
      programId: ws.programId,
      corporateClientId: ws.corporateClientId,
      isAlive: ws.isAlive
    }));
  }

  // Cleanup
  public destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
  }
}

// Real-time event types
export interface RealtimeEvent {
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

// Helper function to create real-time events
export function createRealtimeEvent(
  type: RealtimeEvent['type'],
  data: any,
  target?: RealtimeEvent['target']
): RealtimeEvent {
  return {
    type,
    data,
    timestamp: new Date().toISOString(),
    target
  };
}
