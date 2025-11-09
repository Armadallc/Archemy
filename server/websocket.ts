import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { verifySupabaseToken } from './supabase-auth';

export interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  role?: string;
  programId?: string;
  corporateClientId?: string;
  authorizedPrograms?: string[]; // Array of program IDs user has access to
  isAlive?: boolean;
}

export class RealtimeWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: any) {
    console.log('🔌 Creating WebSocket server...');
    console.log('🔌 HTTP server provided:', !!server);
    console.log('🔌 HTTP server address:', server?.address());
    
    // Wrap verifyClient to catch any errors
    const verifyClientWrapper = async (info: any, callback: (result: boolean, code?: number, name?: string) => void) => {
      try {
        console.log('🔍 verifyClientWrapper called');
        const result = await this.verifyClient(info);
        console.log('🔍 verifyClient result:', result);
        callback(result);
      } catch (error) {
        console.error('❌ verifyClientWrapper error:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
        callback(false, 500, 'Internal Server Error');
      }
    };
    
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: verifyClientWrapper
    });

    console.log('🔌 WebSocket server created successfully');
    console.log('🔌 WebSocket server path:', '/ws');
    console.log('🔌 WebSocket server options:', {
      noServer: false,
      clientTracking: true
    });
    
    // Add error handler to catch any WebSocket server errors
    this.wss.on('error', (error) => {
      console.error('❌ WebSocket server error:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    });
    
    // Log when upgrade requests are received
    server.on('upgrade', (request, socket, head) => {
      console.log('🔍 HTTP upgrade request received:', request.url);
      console.log('🔍 Upgrade headers:', JSON.stringify(request.headers, null, 2));
    });
    
    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private async verifyClient(info: any): Promise<boolean> {
    try {
      console.log('🔍 WebSocket verification started');
      console.log('🔍 Request URL:', info.req.url);
      console.log('🔍 Request headers:', JSON.stringify(info.req.headers, null, 2));
      
      const url = new URL(info.req.url || '', `http://${info.req.headers.host || 'localhost:8081'}`);
      const token = url.searchParams.get('token');
      
      console.log('🔍 Token received:', token ? `${token.substring(0, 20)}... (${token.length} chars)` : 'null');
      
      if (!token) {
        console.log('❌ WebSocket connection rejected: No token provided');
        return false;
      }

      // Check if token is a Supabase JWT or auth_user_id
      let user;
      if (token.startsWith('eyJ')) {
        // It's a Supabase JWT token
        console.log('🔍 Detected JWT token, verifying...');
        user = await verifySupabaseToken(token);
      } else {
        // It's an auth_user_id, look up user directly
        console.log('🔍 Detected auth_user_id, looking up user...');
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        console.log('🔍 Querying users table for auth_user_id:', token);
        const { data: dbUser, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('auth_user_id', token)
          .single();
        
        if (error) {
          console.log('❌ Database query error:', error.message, error);
        }
        
        if (error || !dbUser) {
          console.log('❌ WebSocket connection rejected: User not found in database');
          console.log('   Error details:', error?.message || 'No error');
          console.log('   User data:', dbUser ? 'Found' : 'Not found');
          return false;
        }

        console.log('✅ User found in database:', dbUser.email, dbUser.role);
        user = {
          userId: dbUser.user_id,
          email: dbUser.email,
          role: dbUser.role,
          primaryProgramId: dbUser.primary_program_id,
          corporateClientId: dbUser.corporate_client_id,
          authorizedPrograms: dbUser.authorized_programs || []
        };
      }

      if (!user) {
        console.log('❌ WebSocket connection rejected: Invalid token (user verification failed)');
        return false;
      }

      // Store user info in the request object for later use
      info.req.user = user;
      console.log('✅ WebSocket connection verified for user:', user.email, user.role);
      return true;
    } catch (error) {
      console.error('❌ WebSocket verification error:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
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
                  corporateClientId: dbUser.corporate_client_id,
                  authorizedPrograms: dbUser.authorized_programs || []
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
      ws.authorizedPrograms = user.authorizedPrograms || [];
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

  // Helper function to check if user should receive notification based on hierarchical validation
  private shouldReceiveNotification(
    ws: AuthenticatedWebSocket,
    targetProgramId?: string,
    targetCorporateClientId?: string
  ): boolean {
    // Super admin always receives all notifications
    if (ws.role === 'super_admin') {
      return true;
    }

    // Corporate admin only receives notifications for their corporate client
    if (ws.role === 'corporate_admin') {
      if (targetCorporateClientId && ws.corporateClientId === targetCorporateClientId) {
        return true;
      }
      // Corporate admins should NOT receive program-level notifications unless corporate client matches
      // This ensures isolation: corporate admin for Client A shouldn't see notifications for Client B's programs
      return false;
    }

    // Program-level users (program_admin, program_user, driver) only receive notifications for their authorized programs
    if (targetProgramId) {
      // Check if user's primary program matches
      if (ws.programId === targetProgramId) {
        // If targetCorporateClientId is provided, verify user belongs to that corporate client
        // This prevents cross-corporate leakage even if program IDs somehow match
        if (targetCorporateClientId && ws.corporateClientId) {
          return ws.corporateClientId === targetCorporateClientId;
        }
        // If no corporate client check needed, return true
        return true;
      }
      // Check if user's authorized programs include the target program
      if (ws.authorizedPrograms && ws.authorizedPrograms.includes(targetProgramId)) {
        // If targetCorporateClientId is provided, verify user belongs to that corporate client
        if (targetCorporateClientId && ws.corporateClientId) {
          return ws.corporateClientId === targetCorporateClientId;
        }
        // If no corporate client check needed, return true
        return true;
      }
    }

    return false;
  }

  // Broadcast to users by program (with hierarchical validation)
  public broadcastToProgram(programId: string, data: any, targetCorporateClientId?: string) {
    const message = JSON.stringify(data);
    let sentCount = 0;
    let skippedCount = 0;
    const skippedDetails: any[] = [];
    
    console.log(`\n🔍 broadcastToProgram called:`);
    console.log(`   - Target Program ID: ${programId}`);
    console.log(`   - Target Corporate Client ID: ${targetCorporateClientId || 'none'}`);
    console.log(`   - Total connected clients: ${this.clients.size}`);
    
    // Log all connected clients for debugging
    const allClients: any[] = [];
    this.clients.forEach((ws, userId) => {
      allClients.push({
        userId: ws.userId,
        role: ws.role,
        programId: ws.programId,
        corporateClientId: ws.corporateClientId,
        authorizedPrograms: ws.authorizedPrograms,
        readyState: ws.readyState === WebSocket.OPEN ? 'OPEN' : 'CLOSED'
      });
    });
    console.log(`   - Connected clients:`, JSON.stringify(allClients, null, 2));
    
    this.clients.forEach((ws) => {
      if (ws.readyState !== WebSocket.OPEN) {
        console.log(`   ⚠️ Skipping closed WebSocket for user: ${ws.userId}`);
        return;
      }
      
      // Apply hierarchical validation
      const shouldReceive = this.shouldReceiveNotification(ws, programId, targetCorporateClientId);
      console.log(`   🔍 Checking user ${ws.userId} (${ws.role}):`);
      console.log(`      - User's programId: ${ws.programId}`);
      console.log(`      - User's corporateClientId: ${ws.corporateClientId}`);
      console.log(`      - Target programId: ${programId}`);
      console.log(`      - Target corporateClientId: ${targetCorporateClientId || 'none'}`);
      console.log(`      - Should receive: ${shouldReceive}`);
      
      if (shouldReceive) {
        ws.send(message);
        sentCount++;
        console.log(`   ✅ Sent to user: ${ws.userId} (${ws.role}, program: ${ws.programId}, corporate: ${ws.corporateClientId})`);
      } else {
        skippedCount++;
        skippedDetails.push({
          userId: ws.userId,
          role: ws.role,
          userProgramId: ws.programId,
          userCorporateClientId: ws.corporateClientId,
          targetProgramId: programId,
          targetCorporateClientId: targetCorporateClientId
        });
        console.log(`   ❌ Skipped user: ${ws.userId} (${ws.role}) - permission check failed`);
      }
    });
    
    console.log(`📨 broadcastToProgram(${programId}, corporate: ${targetCorporateClientId || 'none'}): sent to ${sentCount} clients, skipped ${skippedCount}\n`);
    if (skippedCount > 0) {
      console.log(`   ⚠️ Skipped details:`, JSON.stringify(skippedDetails, null, 2));
    }
  }

  // Broadcast to users by corporate client (with hierarchical validation)
  public broadcastToCorporateClient(corporateClientId: string, data: any) {
    const message = JSON.stringify(data);
    let sentCount = 0;
    let skippedCount = 0;
    
    this.clients.forEach((ws) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      
      // Apply hierarchical validation
      if (this.shouldReceiveNotification(ws, undefined, corporateClientId)) {
        ws.send(message);
        sentCount++;
      } else {
        skippedCount++;
      }
    });
    
    console.log(`📨 broadcastToCorporateClient(${corporateClientId}): sent to ${sentCount} clients, skipped ${skippedCount}`);
  }

  // Get connected clients info
  public getConnectedClients() {
    return Array.from(this.clients.values()).map(ws => ({
      userId: ws.userId,
      role: ws.role,
      programId: ws.programId,
      corporateClientId: ws.corporateClientId,
      authorizedPrograms: ws.authorizedPrograms,
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
