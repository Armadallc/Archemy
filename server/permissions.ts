// Permission constants and role-based access control
export const PERMISSIONS = {
  // Organization management
  MANAGE_ORGANIZATIONS: 'manage_organizations',
  VIEW_ALL_ORGANIZATIONS: 'view_all_organizations',
  
  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Service area management
  MANAGE_SERVICE_AREAS: 'manage_service_areas',
  VIEW_SERVICE_AREAS: 'view_service_areas',
  
  // Client management
  MANAGE_CLIENTS: 'manage_clients',
  VIEW_CLIENTS: 'view_clients',
  
  // Driver management
  MANAGE_DRIVERS: 'manage_drivers',
  VIEW_DRIVERS: 'view_drivers',
  
  // Vehicle management
  MANAGE_VEHICLES: 'manage_vehicles',
  VIEW_VEHICLES: 'view_vehicles',
  
  // Trip management
  MANAGE_TRIPS: 'manage_trips',
  VIEW_TRIPS: 'view_trips',
  CREATE_TRIPS: 'create_trips',
  UPDATE_TRIP_STATUS: 'update_trip_status',
  
  // Cross-organizational permissions
  VIEW_CLIENTS_CROSS_ORG: 'view_clients_cross_org',
  MANAGE_CLIENTS_CROSS_ORG: 'manage_clients_cross_org',
  CREATE_TRIPS_CROSS_ORG: 'create_trips_cross_org',
  VIEW_SERVICE_AREAS_CROSS_ORG: 'view_service_areas_cross_org',
  
  // Reports and analytics
  VIEW_REPORTS: 'view_reports',
  VIEW_ANALYTICS: 'view_analytics',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    PERMISSIONS.MANAGE_ORGANIZATIONS,
    PERMISSIONS.VIEW_ALL_ORGANIZATIONS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_SERVICE_AREAS,
    PERMISSIONS.VIEW_SERVICE_AREAS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_TRIPS,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  
  monarch_owner: [
    PERMISSIONS.VIEW_ALL_ORGANIZATIONS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_SERVICE_AREAS,
    PERMISSIONS.VIEW_SERVICE_AREAS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_TRIPS,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.VIEW_CLIENTS_CROSS_ORG,
    PERMISSIONS.MANAGE_CLIENTS_CROSS_ORG,
    PERMISSIONS.CREATE_TRIPS_CROSS_ORG,
    PERMISSIONS.VIEW_SERVICE_AREAS_CROSS_ORG,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  
  organization_admin: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_SERVICE_AREAS,
    PERMISSIONS.VIEW_SERVICE_AREAS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_TRIPS,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  
  organization_user: [
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.MANAGE_TRIPS,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.VIEW_CLIENTS_CROSS_ORG,
    PERMISSIONS.MANAGE_CLIENTS_CROSS_ORG,
    PERMISSIONS.CREATE_TRIPS_CROSS_ORG,
    PERMISSIONS.VIEW_SERVICE_AREAS_CROSS_ORG,
  ],
  
  driver: [
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
  ],
};

// Session timeout by role (in milliseconds)
export const ROLE_SESSION_TIMEOUTS: Record<string, number> = {
  super_admin: 2 * 60 * 60 * 1000, // 2 hours
  monarch_owner: 4 * 60 * 60 * 1000, // 4 hours
  organization_admin: 4 * 60 * 60 * 1000, // 4 hours
  organization_user: 8 * 60 * 60 * 1000, // 8 hours (kiosk mode)
  driver: 12 * 60 * 60 * 1000, // 12 hours (mobile usage)
};

// Helper functions
export function hasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions ? rolePermissions.includes(permission) : false;
}

export function canAccessOrganization(
  userRole: string, 
  userPrimaryOrg: string, 
  userAuthorizedOrgs: string[] | null, 
  requestedOrg: string
): boolean {
  // Super admin can access all organizations
  if (userRole === 'super_admin') return true;
  
  // Executive roles can access organizations within their scope
  if (userRole.endsWith('_owner')) {
    const executiveScope = userRole.replace('_owner', '');
    return requestedOrg.startsWith(executiveScope) || 
           (userAuthorizedOrgs && userAuthorizedOrgs.includes(requestedOrg));
  }
  
  // Check primary organization
  if (userPrimaryOrg === requestedOrg) return true;
  
  // Check authorized organizations
  if (userAuthorizedOrgs && userAuthorizedOrgs.includes(requestedOrg)) return true;
  
  return false;
}

export function getSessionTimeout(userRole: string): number {
  return ROLE_SESSION_TIMEOUTS[userRole] || ROLE_SESSION_TIMEOUTS.organization_admin;
}