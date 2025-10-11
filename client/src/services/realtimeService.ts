import { useQueryClient } from '@tanstack/react-query';
import { WebSocketMessage } from '../hooks/useWebSocket';

export class RealtimeService {
  private queryClient: any;
  private wsConnection: any;

  constructor(queryClient: any, wsConnection: any) {
    this.queryClient = queryClient;
    this.wsConnection = wsConnection;
  }

  // Initialize real-time subscriptions
  public initialize() {
    if (!this.wsConnection) return;

    // Set up message handlers
    this.wsConnection.onMessage = (message: WebSocketMessage) => {
      this.handleRealtimeMessage(message);
    };
  }

  // Handle incoming real-time messages
  private handleRealtimeMessage(message: WebSocketMessage) {
    console.log('🔄 RealtimeService handling message:', message.type);

    switch (message.type) {
      case 'trip_update':
        this.handleTripUpdate(message.data);
        break;
      case 'driver_update':
        this.handleDriverUpdate(message.data);
        break;
      case 'client_update':
        this.handleClientUpdate(message.data);
        break;
      case 'system_update':
        this.handleSystemUpdate(message.data);
        break;
      default:
        console.log('📨 Unknown message type:', message.type);
    }
  }

  // Handle trip updates
  private handleTripUpdate(data: any) {
    console.log('🚗 Trip update received:', data);
    
    // Invalidate trip-related queries
    this.queryClient.invalidateQueries({ 
      queryKey: ['/api/trips'] 
    });
    
    // Invalidate specific trip queries
    if (data.programId) {
      this.queryClient.invalidateQueries({ 
        queryKey: [`/api/trips/program/${data.programId}`] 
      });
    }
    
    if (data.corporateClientId) {
      this.queryClient.invalidateQueries({ 
        queryKey: [`/api/trips/corporate-client/${data.corporateClientId}`] 
      });
    }

    // Invalidate universal trips for super admins
    this.queryClient.invalidateQueries({ 
      queryKey: ['/api/trips/universal'] 
    });
  }

  // Handle driver updates
  private handleDriverUpdate(data: any) {
    console.log('👨‍💼 Driver update received:', data);
    
    // Invalidate driver-related queries
    this.queryClient.invalidateQueries({ 
      queryKey: ['/api/drivers'] 
    });
    
    // Invalidate specific driver queries
    if (data.programId) {
      this.queryClient.invalidateQueries({ 
        queryKey: [`/api/drivers/program/${data.programId}`] 
      });
    }
    
    if (data.corporateClientId) {
      this.queryClient.invalidateQueries({ 
        queryKey: [`/api/drivers/corporate-client/${data.corporateClientId}`] 
      });
    }
  }

  // Handle client updates
  private handleClientUpdate(data: any) {
    console.log('👥 Client update received:', data);
    
    // Invalidate client-related queries
    this.queryClient.invalidateQueries({ 
      queryKey: ['/api/clients'] 
    });
    
    // Invalidate specific client queries
    if (data.programId) {
      this.queryClient.invalidateQueries({ 
        queryKey: [`/api/clients/program/${data.programId}`] 
      });
    }
    
    if (data.corporateClientId) {
      this.queryClient.invalidateQueries({ 
        queryKey: [`/api/clients/corporate-client/${data.corporateClientId}`] 
      });
    }
  }

  // Handle system updates
  private handleSystemUpdate(data: any) {
    console.log('⚙️ System update received:', data);
    
    // Invalidate all queries for a full refresh
    this.queryClient.invalidateQueries();
  }

  // Send trip status update
  public sendTripStatusUpdate(tripId: string, status: string, additionalData?: any) {
    if (!this.wsConnection?.sendMessage) return;

    this.wsConnection.sendMessage({
      type: 'trip_status_update',
      data: {
        tripId,
        status,
        ...additionalData
      },
      timestamp: new Date().toISOString()
    });
  }

  // Send driver location update
  public sendDriverLocationUpdate(driverId: string, location: { lat: number; lng: number }, additionalData?: any) {
    if (!this.wsConnection?.sendMessage) return;

    this.wsConnection.sendMessage({
      type: 'driver_location_update',
      data: {
        driverId,
        location,
        ...additionalData
      },
      timestamp: new Date().toISOString()
    });
  }

  // Send emergency alert
  public sendEmergencyAlert(alertType: string, message: string, targetRoles?: string[]) {
    if (!this.wsConnection?.sendMessage) return;

    this.wsConnection.sendMessage({
      type: 'emergency_alert',
      data: {
        alertType,
        message,
        targetRoles
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Hook to use the real-time service
export function useRealtimeService() {
  const queryClient = useQueryClient();
  
  return {
    createService: (wsConnection: any) => new RealtimeService(queryClient, wsConnection)
  };
}




