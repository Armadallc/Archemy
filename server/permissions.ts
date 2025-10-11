// Permission constants and role-based access control for new architecture
export const PERMISSIONS = {
  // Corporate client management
  MANAGE_CORPORATE_CLIENTS: 'manage_corporate_clients',
  VIEW_CORPORATE_CLIENTS: 'view_corporate_clients',
  
  // Program management (renamed from organizations)
  MANAGE_PROGRAMS: 'manage_programs',
  VIEW_PROGRAMS: 'view_programs',
  
  // Location management (renamed from service areas)
  MANAGE_LOCATIONS: 'manage_locations',
  VIEW_LOCATIONS: 'view_locations',
  
  // User management
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  
  // Client management
  MANAGE_CLIENTS: 'manage_clients',
  VIEW_CLIENTS: 'view_clients',
  
  // Client group management (new)
  MANAGE_CLIENT_GROUPS: 'manage_client_groups',
  VIEW_CLIENT_GROUPS: 'view_client_groups',
  
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
  
  // Trip categories (new)
  MANAGE_TRIP_CATEGORIES: 'manage_trip_categories',
  VIEW_TRIP_CATEGORIES: 'view_trip_categories',
  
  // Cross-corporate permissions
  VIEW_CLIENTS_CROSS_CORPORATE: 'view_clients_cross_corporate',
  MANAGE_CLIENTS_CROSS_CORPORATE: 'manage_clients_cross_corporate',
  CREATE_TRIPS_CROSS_CORPORATE: 'create_trips_cross_corporate',
  VIEW_PROGRAMS_CROSS_CORPORATE: 'view_programs_cross_corporate',
  
  // Reports and analytics
  VIEW_REPORTS: 'view_reports',
  VIEW_ANALYTICS: 'view_analytics',
  
  // Mobile app permissions
  MOBILE_APP_ACCESS: 'mobile_app_access',
  LOCATION_TRACKING: 'location_tracking',
  
  // Notification permissions
  MANAGE_NOTIFICATIONS: 'manage_notifications',
  VIEW_NOTIFICATIONS: 'view_notifications',
  
  // Calendar permissions
  MANAGE_CALENDAR: 'manage_calendar',
  VIEW_CALENDAR: 'view_calendar',
  
  // Webhook permissions
  MANAGE_WEBHOOKS: 'manage_webhooks',
  VIEW_WEBHOOKS: 'view_webhooks',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-based permission mapping for new 5-tier hierarchy
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    // Full system access
    PERMISSIONS.MANAGE_CORPORATE_CLIENTS,
    PERMISSIONS.VIEW_CORPORATE_CLIENTS,
    PERMISSIONS.MANAGE_PROGRAMS,
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.MANAGE_LOCATIONS,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.MANAGE_CLIENT_GROUPS,
    PERMISSIONS.VIEW_CLIENT_GROUPS,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_TRIPS,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.MANAGE_TRIP_CATEGORIES,
    PERMISSIONS.VIEW_TRIP_CATEGORIES,
    PERMISSIONS.VIEW_CLIENTS_CROSS_CORPORATE,
    PERMISSIONS.MANAGE_CLIENTS_CROSS_CORPORATE,
    PERMISSIONS.CREATE_TRIPS_CROSS_CORPORATE,
    PERMISSIONS.VIEW_PROGRAMS_CROSS_CORPORATE,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MOBILE_APP_ACCESS,
    PERMISSIONS.LOCATION_TRACKING,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.MANAGE_CALENDAR,
    PERMISSIONS.VIEW_CALENDAR,
    PERMISSIONS.MANAGE_WEBHOOKS,
    PERMISSIONS.VIEW_WEBHOOKS,
  ],
  
  corporate_admin: [
    // Corporate client level access
    PERMISSIONS.VIEW_CORPORATE_CLIENTS,
    PERMISSIONS.MANAGE_PROGRAMS,
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.MANAGE_LOCATIONS,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.MANAGE_CLIENT_GROUPS,
    PERMISSIONS.VIEW_CLIENT_GROUPS,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_TRIPS,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.MANAGE_TRIP_CATEGORIES,
    PERMISSIONS.VIEW_TRIP_CATEGORIES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MOBILE_APP_ACCESS,
    PERMISSIONS.LOCATION_TRACKING,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.MANAGE_CALENDAR,
    PERMISSIONS.VIEW_CALENDAR,
    PERMISSIONS.MANAGE_WEBHOOKS,
    PERMISSIONS.VIEW_WEBHOOKS,
  ],
  
  program_admin: [
    // Program level access
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.MANAGE_LOCATIONS,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.MANAGE_CLIENT_GROUPS,
    PERMISSIONS.VIEW_CLIENT_GROUPS,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.MANAGE_VEHICLES,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.MANAGE_TRIPS,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.MANAGE_TRIP_CATEGORIES,
    PERMISSIONS.VIEW_TRIP_CATEGORIES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MOBILE_APP_ACCESS,
    PERMISSIONS.LOCATION_TRACKING,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.MANAGE_CALENDAR,
    PERMISSIONS.VIEW_CALENDAR,
    PERMISSIONS.VIEW_WEBHOOKS,
  ],
  
  program_user: [
    // Limited program access
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.VIEW_CLIENT_GROUPS,
    PERMISSIONS.VIEW_DRIVERS,
    PERMISSIONS.VIEW_VEHICLES,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.CREATE_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.VIEW_TRIP_CATEGORIES,
    PERMISSIONS.MOBILE_APP_ACCESS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_CALENDAR,
  ],
  
  driver: [
    // Driver-specific permissions
    PERMISSIONS.VIEW_PROGRAMS,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.VIEW_TRIPS,
    PERMISSIONS.UPDATE_TRIP_STATUS,
    PERMISSIONS.VIEW_TRIP_CATEGORIES,
    PERMISSIONS.MOBILE_APP_ACCESS,
    PERMISSIONS.LOCATION_TRACKING,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_CALENDAR,
  ],
};

// Check if user has specific permission
export function hasPermission(userRole: string, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

// Check if user can access a specific program
export function canAccessProgram(
  userRole: string,
  primaryProgramId: string | null,
  authorizedPrograms: string[] | null,
  requestedProgramId: string
): boolean {
  // Super admin can access all programs
  if (userRole === 'super_admin') {
    return true;
  }
  
  // Corporate admin can access all programs within their corporate client
  if (userRole === 'corporate_admin') {
    return true; // Will be filtered by corporate client in the application logic
  }
  
  // Program admin and program user can access their primary program
  if (primaryProgramId === requestedProgramId) {
    return true;
  }
  
  // Check authorized programs
  if (authorizedPrograms && authorizedPrograms.includes(requestedProgramId)) {
    return true;
  }
  
  return false;
}

// Check if user can access a specific corporate client
export function canAccessCorporateClient(
  userRole: string,
  requestedCorporateClientId: string
): boolean {
  // Super admin can access all corporate clients
  if (userRole === 'super_admin') {
    return true;
  }
  
  // Corporate admin can access their own corporate client
  if (userRole === 'corporate_admin') {
    return true; // Will be filtered by corporate client in the application logic
  }
  
  // Other roles cannot access corporate client level
  return false;
}

// Check if user can access a specific location
export function canAccessLocation(
  userRole: string,
  primaryProgramId: string | null,
  authorizedPrograms: string[] | null,
  requestedLocationId: string,
  locationProgramId: string
): boolean {
  // First check if user can access the program that owns this location
  return canAccessProgram(userRole, primaryProgramId, authorizedPrograms, locationProgramId);
}

// Check if user can access a specific client
export function canAccessClient(
  userRole: string,
  primaryProgramId: string | null,
  authorizedPrograms: string[] | null,
  requestedClientId: string,
  clientProgramId: string
): boolean {
  // First check if user can access the program that owns this client
  return canAccessProgram(userRole, primaryProgramId, authorizedPrograms, clientProgramId);
}

// Check if user can access a specific trip
export function canAccessTrip(
  userRole: string,
  primaryProgramId: string | null,
  authorizedPrograms: string[] | null,
  requestedTripId: string,
  tripProgramId: string
): boolean {
  // First check if user can access the program that owns this trip
  return canAccessProgram(userRole, primaryProgramId, authorizedPrograms, tripProgramId);
}

// Get session timeout based on role
export function getSessionTimeout(userRole: string): number {
  const timeouts: Record<string, number> = {
    super_admin: 24 * 60 * 60 * 1000, // 24 hours
    corporate_admin: 12 * 60 * 60 * 1000, // 12 hours
    program_admin: 8 * 60 * 60 * 1000, // 8 hours
    program_user: 4 * 60 * 60 * 1000, // 4 hours
    driver: 2 * 60 * 60 * 1000, // 2 hours
  };
  
  return timeouts[userRole] || 2 * 60 * 60 * 1000; // Default 2 hours
}

// Get role hierarchy level (lower number = higher privilege)
export function getRoleLevel(userRole: string): number {
  const levels: Record<string, number> = {
    super_admin: 1,
    corporate_admin: 2,
    program_admin: 3,
    program_user: 4,
    driver: 5,
  };
  
  return levels[userRole] || 5;
}

// Check if one role can manage another role
export function canManageRole(managerRole: string, targetRole: string): boolean {
  const managerLevel = getRoleLevel(managerRole);
  const targetLevel = getRoleLevel(targetRole);
  
  // Can only manage roles at a lower level (higher number)
  return managerLevel < targetLevel;
}

// Get all roles that a user can manage
export function getManageableRoles(userRole: string): string[] {
  const userLevel = getRoleLevel(userRole);
  const allRoles = Object.keys(ROLE_PERMISSIONS);
  
  return allRoles.filter(role => getRoleLevel(role) > userLevel);
}

// Check if user can perform action on resource
export function canPerformAction(
  userRole: string,
  action: string,
  resource: string,
  resourceOwner?: string
): boolean {
  // Super admin can do everything
  if (userRole === 'super_admin') {
    return true;
  }
  
  // Check specific permissions
  const permission = `${action.toUpperCase()}_${resource.toUpperCase()}` as Permission;
  if (hasPermission(userRole, permission)) {
    return true;
  }
  
  // Check if user can access the resource owner
  if (resourceOwner) {
    return canAccessProgram(userRole, null, null, resourceOwner);
  }
  
  return false;
}