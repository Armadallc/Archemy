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
      return 'Trip confirmed';
    case 'in_progress':
      return 'Trip started';
    case 'completed':
      return 'Trip completed';
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

  console.log('🔍 broadcastTripUpdate called:', {
    tripId: tripData?.id || 'no id',
    status: tripData?.status || 'no status',
    previousStatus: previousStatus || 'none',
    programId: target?.programId || 'none',
    driverId: target?.driverId || 'none',
    userId: target?.userId || 'none'
  });

  // Generate status-specific message
  const statusMessage = getStatusMessage(tripData.status || 'unknown', previousStatus);
  const statusChange = previousStatus && previousStatus !== tripData.status 
    ? `${previousStatus} → ${tripData.status}`
    : tripData.status;

  // Extract client name from trip data to match frontend expectations
  // Handle both array and object formats for clients
  let clientName: string | null = null;
  
  if (tripData.client_name) {
    clientName = tripData.client_name;
  } else if (tripData.clients) {
    // Handle array format
    const client = Array.isArray(tripData.clients) ? tripData.clients[0] : tripData.clients;
    if (client?.first_name || client?.last_name) {
      clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim();
    }
  }
  
  // Try client groups if no individual client found
  if (!clientName && (tripData.client_groups || tripData.client_group_name)) {
    const group = Array.isArray(tripData.client_groups) ? tripData.client_groups[0] : tripData.client_groups;
    clientName = group?.name || tripData.client_group_name || null;
  }
  
  // Final fallback
  if (!clientName) {
    clientName = 'Unknown Client';
  }

  // Enhance message with client name and driver context if driver made the update
  let enhancedMessage = statusMessage;
  if (clientName && clientName !== 'Unknown Client') {
    enhancedMessage = `${statusMessage} for ${clientName}`;
  }
  if (target?.driverName && target?.updatedBy && target?.role === 'driver') {
    enhancedMessage = `${target.driverName} ${statusMessage.toLowerCase()}${clientName && clientName !== 'Unknown Client' ? ` for ${clientName}` : ''}`;
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
      // Ensure frontend-expected fields are present
      tripId: tripData.id || tripData.tripId,
      clientName: clientName,
      status: tripData.status,
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
    programId: target?.programId || 'none',
    clientName: clientName,
    hasClientData: !!(tripData.clients || tripData.client_groups || tripData.client_name),
    notificationMessage: enhancedMessage
  });

  // Priority 1: Send to assigned driver if status changed (driver needs to know about updates)
  // Use userId if provided (more reliable), otherwise use driverId
  const driverUserId = target?.userId || target?.driverId;
  let driverNotified = false;
  if (driverUserId) {
    console.log(`   → Sending to driver user: ${driverUserId}`);
    const sent = wsServerInstance.sendToUser(driverUserId, event);
    if (sent) {
      driverNotified = true;
      console.log(`   ✅ Notification sent to driver user: ${driverUserId}`);
    } else {
      console.warn(`   ⚠️ Driver user ${driverUserId} is not connected`);
    }
    // Don't return early - we still need to notify program users (admins)
  }

  // Priority 2: Send to specific user if provided (and different from driver)
  if (target?.userId && target.userId !== driverUserId) {
    console.log(`   → Sending to user: ${target.userId}`);
    wsServerInstance.sendToUser(target.userId, event);
  }

  // Priority 3: Broadcast to program users (admins/users need to see status updates)
  // IMPORTANT: Always broadcast to program users when trip status changes, even if driver was notified
  // This ensures admins see real-time updates when drivers change trip status
  // Extract corporate_client_id from trip data if available (handles both storage formats)
  const tripCorporateClientId = tripData.program?.corporate_client_id 
    || tripData.programs?.corporate_client_id
    || tripData.programs?.corporate_clients?.id
    || tripData.programs?.corporate_clients?.corporate_client_id
    || target?.corporateClientId;
  
  if (target?.programId) {
    console.log(`   → Broadcasting to program: ${target.programId} (corporate client: ${tripCorporateClientId || 'unknown'})`);
    console.log(`   → Event type: ${event.type}, Status: ${tripData.status}, Client: ${clientName}`);
    wsServerInstance.broadcastToProgram(target.programId, event, tripCorporateClientId);
    console.log(`   → Program broadcast completed`);
  } else {
    console.log(`   ⚠️ No programId provided, skipping program broadcast`);
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

// Helper function to broadcast trip tagging
export function broadcastTripTagged(
  tripData: any,
  target?: {
    userId?: string;
    programId?: string;
    corporateClientId?: string;
    clientName?: string;
  }
) {
  if (!wsServerInstance) {
    console.warn('⚠️ WebSocket server not initialized, cannot broadcast trip tagging');
    return;
  }

  // Extract client name
  let clientName: string | null = target?.clientName || null;
  
  if (!clientName) {
    if (tripData.client_name) {
      clientName = tripData.client_name;
    } else if (tripData.clients) {
      const client = Array.isArray(tripData.clients) ? tripData.clients[0] : tripData.clients;
      if (client?.first_name || client?.last_name) {
        clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim();
      }
    }
    
    if (!clientName && (tripData.client_groups || tripData.client_group_name)) {
      const group = Array.isArray(tripData.client_groups) ? tripData.client_groups[0] : tripData.client_groups;
      clientName = group?.name || tripData.client_group_name || null;
    }
    
    if (!clientName) {
      clientName = 'Unknown Client';
    }
  }

  const event = {
    type: 'trip_tagged' as const,
    data: {
      ...tripData,
      tripId: tripData.id || tripData.tripId,
      clientName: clientName,
      notificationTitle: "You've been tagged in a trip",
      notificationMessage: `You've been tagged to receive notifications for ${clientName}'s trip`
    },
    timestamp: new Date().toISOString(),
    target
  };

  console.log('📨 Broadcasting trip_tagged notification:', {
    tripId: tripData.id,
    clientName: clientName,
    userId: target?.userId || 'none',
    programId: target?.programId || 'none'
  });

  // Send to specific user if provided
  if (target?.userId) {
    wsServerInstance.sendToUser(target.userId, event);
  }

  // Also broadcast to program if provided
  if (target?.programId) {
    const tripCorporateClientId = tripData.program?.corporate_client_id 
      || tripData.programs?.corporate_client_id
      || tripData.programs?.corporate_clients?.id
      || tripData.programs?.corporate_clients?.corporate_client_id
      || target?.corporateClientId;
    
    wsServerInstance.broadcastToProgram(target.programId, event, tripCorporateClientId);
  }
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

  // Transform trip data to match frontend expectations
  // Frontend expects: tripId, clientName, pickupTime
  // Handle both array and object formats for clients
  let clientName: string | null = null;
  
  if (tripData.client_name) {
    clientName = tripData.client_name;
  } else if (tripData.clients) {
    // Handle array format
    const client = Array.isArray(tripData.clients) ? tripData.clients[0] : tripData.clients;
    if (client?.first_name || client?.last_name) {
      clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim();
    }
  }
  
  // Try client groups if no individual client found
  if (!clientName && (tripData.client_groups || tripData.client_group_name)) {
    const group = Array.isArray(tripData.client_groups) ? tripData.client_groups[0] : tripData.client_groups;
    clientName = group?.name || tripData.client_group_name || null;
  }
  
  // Final fallback
  if (!clientName) {
    clientName = 'Unknown Client';
  }

  const transformedData = {
    tripId: tripData.id,
    clientName: clientName,
    pickupTime: tripData.scheduled_pickup_time || tripData.pickup_time,
    // Include full trip data for reference
    ...tripData
  };

  const event = {
    type: 'new_trip' as const, // Changed from 'trip_created' to 'new_trip' to match frontend
    data: transformedData,
    timestamp: new Date().toISOString(),
    target
  };

  const connectedUserIds = wsServerInstance ? wsServerInstance.getConnectedUserIds() : [];
  console.log('📨 Broadcasting new_trip notification:', {
    tripId: tripData.id,
    clientName: transformedData.clientName,
    driverUserId: target?.userId || 'none',
    driverId: tripData.driver_id || 'none',
    programId: target?.programId || 'none',
    hasClientData: !!(tripData.clients || tripData.client_groups || tripData.client_name),
    hasClientGroupData: !!tripData.client_groups,
    wsServerInitialized: !!wsServerInstance,
    connectedClientsCount: wsServerInstance ? wsServerInstance.getConnectedClientsCount() : 0,
    connectedUserIds: connectedUserIds,
    driverIsConnected: target?.userId ? connectedUserIds.includes(target.userId) : false
  });

  // If specific driver is assigned, send to that driver first
  let driverNotified = false;
  if (target?.userId) {
    console.log(`   → Attempting to send to driver user: ${target.userId}`);
    console.log(`   → WebSocket server instance exists: ${!!wsServerInstance}`);
    if (wsServerInstance) {
      console.log(`   → Connected clients count: ${wsServerInstance.getConnectedClientsCount()}`);
      console.log(`   → Connected user IDs: ${JSON.stringify(wsServerInstance.getConnectedUserIds())}`);
    }
    const sent = wsServerInstance.sendToUser(target.userId, event);
    console.log(`   → sendToUser returned: ${sent}`);
    if (sent) {
      console.log(`   ✅ Notification sent to driver user: ${target.userId}`);
      driverNotified = true;
    } else {
      console.warn(`   ⚠️ Driver user ${target.userId} is not connected. Will broadcast to program as fallback.`);
      // Continue to broadcast to program so admins are notified
      // The driver will see the trip when they reconnect and refresh
    }
  } else {
    console.log(`   → No driver userId provided in target`);
  }
  
  // If driver was successfully notified, don't also broadcast to program to avoid duplicates
  // But if driver wasn't notified (not connected), still broadcast to program
  if (driverNotified && target?.userId) {
    console.log(`   → Driver notified, skipping program broadcast to avoid duplicates`);
    return;
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




