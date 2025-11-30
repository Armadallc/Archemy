import { RealtimeWebSocketServer } from './websocket';

// Global WebSocket server instance
let wsServerInstance: RealtimeWebSocketServer | null = null;

export function setWebSocketServer(wsServer: RealtimeWebSocketServer) {
  wsServerInstance = wsServer;
}

export function getWebSocketServer(): RealtimeWebSocketServer | null {
  return wsServerInstance;
}

// Helper function to get status-specific notification message
function getStatusMessage(status: string, previousStatus?: string): string {
  switch (status) {
    case 'scheduled':
      return previousStatus ? 'Trip status changed to scheduled' : 'Trip scheduled';
    case 'confirmed':
      return 'Trip confirmed and ready';
    case 'in_progress':
      return 'Driver started trip';
    case 'completed':
      return 'Trip completed successfully';
    case 'cancelled':
      return 'Trip cancelled';
    case 'no_show':
      return 'Client did not show up';
    default:
      return 'Trip status updated';
  }
}

// Helper function to broadcast trip updates
export function broadcastTripUpdate(
  tripData: any, 
  previousStatus?: string,
  target?: {
    userId?: string;
    role?: string;
    programId?: string;
    corporateClientId?: string;
    driverId?: string; // NEW: Direct driver targeting
    updatedBy?: string; // NEW: Who made the update (user_id or role)
    driverName?: string; // NEW: Driver name for context when driver updates
    action?: 'status_update' | 'assignment' | 'modification' | 'cancellation'; // NEW: Type of action
  }
) {
  if (!wsServerInstance) {
    console.warn('⚠️ WebSocket server not initialized, cannot broadcast trip update');
    return;
  }

  // Generate status-specific message
  const statusMessage = getStatusMessage(tripData.status || 'unknown', previousStatus);
  const statusChange = previousStatus && previousStatus !== tripData.status 
    ? `${previousStatus} → ${tripData.status}`
    : tripData.status;

  // Enhance message with driver context if driver made the update
  let enhancedMessage = statusMessage;
  if (target?.driverName && target?.updatedBy && target?.role === 'driver') {
    enhancedMessage = `${target.driverName} ${statusMessage.toLowerCase()}`;
  }

  // Determine notification title based on action
  let notificationTitle = `Trip ${tripData.status === 'completed' ? 'Completed' : 'Updated'}`;
  if (target?.action === 'assignment') {
    notificationTitle = 'Trip Assigned';
  } else if (target?.action === 'cancellation') {
    notificationTitle = 'Trip Cancelled';
  } else if (target?.action === 'modification') {
    notificationTitle = 'Trip Modified';
  }

  const event = {
    type: 'trip_update' as const,
    data: {
      ...tripData,
      previousStatus,
      statusChange,
      message: statusMessage,
      notificationTitle,
      notificationMessage: enhancedMessage,
      // Add driver context for admin notifications
      updatedBy: target?.updatedBy,
      updatedByRole: target?.role,
      driverName: target?.driverName,
      action: target?.action || 'status_update'
    },
    timestamp: new Date().toISOString(),
    target
  };

  console.log('📨 Broadcasting trip_update notification:', {
    tripId: tripData.id,
    statusChange,
    action: target?.action || 'status_update',
    driverId: target?.driverId || 'none',
    driverName: target?.driverName || 'none',
    updatedBy: target?.updatedBy || 'none',
    programId: target?.programId || 'none'
  });

  // Priority 1: Send to assigned driver if status changed (driver needs to know about updates)
  if (target?.driverId) {
    console.log(`   → Sending to driver: ${target.driverId}`);
    wsServerInstance.sendToUser(target.driverId, event);
  }

  // Priority 2: Send to specific user if provided
  if (target?.userId && target.userId !== target?.driverId) {
    console.log(`   → Sending to user: ${target.userId}`);
    wsServerInstance.sendToUser(target.userId, event);
  }

  // Priority 3: Broadcast to program users (admins/users need to see status updates)
  // Extract corporate_client_id from trip data if available (handles both storage formats)
  const tripCorporateClientId = tripData.program?.corporate_client_id 
    || tripData.programs?.corporate_client_id
    || tripData.programs?.corporate_clients?.id
    || tripData.programs?.corporate_clients?.corporate_client_id
    || target?.corporateClientId;
  
  if (target?.programId) {
    console.log(`   → Broadcasting to program: ${target.programId} (corporate client: ${tripCorporateClientId || 'unknown'})`);
    wsServerInstance.broadcastToProgram(target.programId, event, tripCorporateClientId);
  }

  // Priority 4: Broadcast to corporate client users
  if (target?.corporateClientId || tripCorporateClientId) {
    const corporateClientId = target?.corporateClientId || tripCorporateClientId;
    console.log(`   → Broadcasting to corporate client: ${corporateClientId}`);
    wsServerInstance.broadcastToCorporateClient(corporateClientId, event);
  }

  // Priority 5: Broadcast to role if no program/corporate client specified
  if (target?.role && !target?.programId && !target?.corporateClientId) {
    console.log(`   → Broadcasting to role: ${target.role}`);
    wsServerInstance.broadcastToRole(target.role, event);
  }

  // Note: We don't do a global broadcast here to maintain hierarchical isolation
}

// Helper function to broadcast driver updates
export function broadcastDriverUpdate(driverData: any, target?: {
  userId?: string;
  role?: string;
  programId?: string;
  corporateClientId?: string;
}) {
  if (!wsServerInstance) return;

  const event = {
    type: 'driver_update' as const,
    data: driverData,
    timestamp: new Date().toISOString(),
    target
  };

  if (target?.userId) {
    wsServerInstance.sendToUser(target.userId, event);
  } else if (target?.role) {
    wsServerInstance.broadcastToRole(target.role, event);
  } else if (target?.programId) {
    wsServerInstance.broadcastToProgram(target.programId, event, target.corporateClientId);
  } else if (target?.corporateClientId) {
    wsServerInstance.broadcastToCorporateClient(target.corporateClientId, event);
  } else {
    wsServerInstance.broadcast(event);
  }
}

// Helper function to broadcast client updates
export function broadcastClientUpdate(clientData: any, target?: {
  userId?: string;
  role?: string;
  programId?: string;
  corporateClientId?: string;
}) {
  if (!wsServerInstance) return;

  const event = {
    type: 'client_update' as const,
    data: clientData,
    timestamp: new Date().toISOString(),
    target
  };

  if (target?.userId) {
    wsServerInstance.sendToUser(target.userId, event);
  } else if (target?.role) {
    wsServerInstance.broadcastToRole(target.role, event);
  } else if (target?.programId) {
    wsServerInstance.broadcastToProgram(target.programId, event, target.corporateClientId);
  } else if (target?.corporateClientId) {
    wsServerInstance.broadcastToCorporateClient(target.corporateClientId, event);
  } else {
    wsServerInstance.broadcast(event);
  }
}

// Helper function to broadcast system updates
export function broadcastSystemUpdate(systemData: any, target?: {
  userId?: string;
  role?: string;
  programId?: string;
  corporateClientId?: string;
}) {
  if (!wsServerInstance) return;

  const event = {
    type: 'system_update' as const,
    data: systemData,
    timestamp: new Date().toISOString(),
    target
  };

  if (target?.userId) {
    wsServerInstance.sendToUser(target.userId, event);
  } else if (target?.role) {
    wsServerInstance.broadcastToRole(target.role, event);
  } else if (target?.programId) {
    wsServerInstance.broadcastToProgram(target.programId, event, target.corporateClientId);
  } else if (target?.corporateClientId) {
    wsServerInstance.broadcastToCorporateClient(target.corporateClientId, event);
  } else {
    wsServerInstance.broadcast(event);
  }
}

// Helper function to broadcast trip creation
export function broadcastTripCreated(tripData: any, target?: {
  userId?: string;
  role?: string;
  programId?: string;
  corporateClientId?: string;
}) {
  if (!wsServerInstance) {
    console.warn('⚠️ WebSocket server not initialized, cannot broadcast trip creation');
    return;
  }

  const event = {
    type: 'trip_created' as const,
    data: tripData,
    timestamp: new Date().toISOString(),
    target
  };

  console.log('📨 Broadcasting trip_created notification:', {
    tripId: tripData.id,
    driverUserId: target?.userId || 'none',
    programId: target?.programId || 'none'
  });

  // If specific driver is assigned, send to that driver first
  if (target?.userId) {
    console.log(`   → Sending to driver user: ${target.userId}`);
    wsServerInstance.sendToUser(target.userId, event);
  }
  
  // Also broadcast to program users (admins/users need to know about new trips)
  // Extract corporate_client_id from trip data if available (handles both storage formats)
  const tripCorporateClientId = tripData.program?.corporate_client_id 
    || tripData.programs?.corporate_client_id
    || tripData.programs?.corporate_clients?.id
    || tripData.programs?.corporate_clients?.corporate_client_id
    || target?.corporateClientId;
  
  if (target?.programId) {
    console.log(`   → Broadcasting to program: ${target.programId} (corporate client: ${tripCorporateClientId || 'unknown'})`);
    console.log(`   → Target details:`, {
      programId: target.programId,
      corporateClientId: tripCorporateClientId,
      userId: target?.userId,
      role: target?.role
    });
    wsServerInstance.broadcastToProgram(target.programId, event, tripCorporateClientId);
  } else if (target?.corporateClientId || tripCorporateClientId) {
    const corporateClientId = target?.corporateClientId || tripCorporateClientId;
    console.log(`   → Broadcasting to corporate client: ${corporateClientId}`);
    wsServerInstance.broadcastToCorporateClient(corporateClientId, event);
  } else if (target?.role) {
    console.log(`   → Broadcasting to role: ${target.role}`);
    wsServerInstance.broadcastToRole(target.role, event);
  }
  
  // Note: We don't do a global broadcast here to maintain hierarchical isolation
}




