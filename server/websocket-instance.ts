import { RealtimeWebSocketServer } from './websocket';

// Global WebSocket server instance
let wsServerInstance: RealtimeWebSocketServer | null = null;

export function setWebSocketServer(wsServer: RealtimeWebSocketServer) {
  wsServerInstance = wsServer;
}

export function getWebSocketServer(): RealtimeWebSocketServer | null {
  return wsServerInstance;
}

// Helper function to broadcast trip updates
export function broadcastTripUpdate(tripData: any, target?: {
  userId?: string;
  role?: string;
  programId?: string;
  corporateClientId?: string;
}) {
  if (!wsServerInstance) return;

  const event = {
    type: 'trip_update' as const,
    data: tripData,
    timestamp: new Date().toISOString(),
    target
  };

  if (target?.userId) {
    wsServerInstance.sendToUser(target.userId, event);
  } else if (target?.role) {
    wsServerInstance.broadcastToRole(target.role, event);
  } else if (target?.programId) {
    wsServerInstance.broadcastToProgram(target.programId, event);
  } else if (target?.corporateClientId) {
    wsServerInstance.broadcastToCorporateClient(target.corporateClientId, event);
  } else {
    wsServerInstance.broadcast(event);
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
    wsServerInstance.broadcastToProgram(target.programId, event);
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
    wsServerInstance.broadcastToProgram(target.programId, event);
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
    wsServerInstance.broadcastToProgram(target.programId, event);
  } else if (target?.corporateClientId) {
    wsServerInstance.broadcastToCorporateClient(target.corporateClientId, event);
  } else {
    wsServerInstance.broadcast(event);
  }
}




