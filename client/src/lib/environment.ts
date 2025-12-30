// Frontend environment configuration for new architectural blueprint
const NODE_ENV = import.meta.env.NODE_ENV || 'development';
// Use actual environment instead of forcing production
const isProduction = NODE_ENV === 'production';
const isDevelopment = !isProduction;

// Corporate Clients Configuration
export const CORPORATE_CLIENTS = {
  monarch: {
    id: 'monarch',
    name: 'Monarch',
    programs: [
      'monarch_competency',
      'monarch_mental_health',
      'monarch_sober_living',
      'monarch_launch'
    ]
  },
  halcyon: {
    id: 'halcyon',
    name: 'Halcyon Health',
    programs: [
      'halcyon_detox'
    ]
  }
};

// Production: Real programs only
const PRODUCTION_PROGRAMS = [
  { id: 'monarch_competency', name: 'Monarch Competency Center', corporateClientId: 'monarch' },
  { id: 'monarch_mental_health', name: 'Monarch Mental Health', corporateClientId: 'monarch' },
  { id: 'monarch_sober_living', name: 'Monarch Sober Living', corporateClientId: 'monarch' },
  { id: 'monarch_launch', name: 'Monarch Launch', corporateClientId: 'monarch' },
  { id: 'halcyon_detox', name: 'Halcyon Detox Program', corporateClientId: 'halcyon' }
];

// Development: Demo programs for testing
const DEVELOPMENT_PROGRAMS = [
  { id: 'monarch_competency', name: 'Monarch Competency Center', corporateClientId: 'monarch' },
  { id: 'monarch_mental_health', name: 'Monarch Mental Health', corporateClientId: 'monarch' },
  { id: 'monarch_sober_living', name: 'Monarch Sober Living', corporateClientId: 'monarch' },
  { id: 'monarch_launch', name: 'Monarch Launch', corporateClientId: 'monarch' },
  { id: 'halcyon_detox', name: 'Halcyon Detox Program', corporateClientId: 'halcyon' },
  { id: 'demo_program_1', name: 'Demo Program 1', corporateClientId: 'monarch' },
  { id: 'demo_program_2', name: 'Demo Program 2', corporateClientId: 'monarch' },
  { id: 'demo_program_3', name: 'Demo Program 3', corporateClientId: 'monarch' }
];

export const ENVIRONMENT = {
  nodeEnv: NODE_ENV,
  isProduction,
  isDevelopment
};

export const DEFAULT_PROGRAM_ID = isProduction ? 'monarch_competency' : 'monarch_competency';
export const CORPORATE_LEVEL_PROGRAM_ID = null; // For super admin corporate level access
export const DEFAULT_CORPORATE_CLIENT_ID = 'monarch';

export const AVAILABLE_PROGRAMS = isProduction ? PRODUCTION_PROGRAMS : DEVELOPMENT_PROGRAMS;

// Helper to validate program in current environment
export function isValidProgramForEnvironment(programId: string): boolean {
  return AVAILABLE_PROGRAMS.some(program => program.id === programId);
}

// Helper to get programs for a corporate client
export function getProgramsForCorporateClient(corporateClientId: string) {
  return AVAILABLE_PROGRAMS.filter(program => program.corporateClientId === corporateClientId);
}

// Helper to get corporate client for a program
export function getCorporateClientForProgram(programId: string) {
  const program = AVAILABLE_PROGRAMS.find(program => program.id === programId);
  return program ? CORPORATE_CLIENTS[program.corporateClientId as keyof typeof CORPORATE_CLIENTS] : null;
}

// Role hierarchy levels (lower number = higher privilege)
export const ROLE_HIERARCHY = {
  super_admin: 1,
  corporate_admin: 2,
  program_admin: 3,
  program_user: 4,
  driver: 5
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

// Check if one role can manage another role
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[managerRole] < ROLE_HIERARCHY[targetRole];
}

// Get all roles that a user can manage
export function getManageableRoles(userRole: UserRole): UserRole[] {
  const userLevel = ROLE_HIERARCHY[userRole];
  return (Object.keys(ROLE_HIERARCHY) as UserRole[]).filter(role => ROLE_HIERARCHY[role] > userLevel);
}

// Trip categories configuration
export const TRIP_CATEGORIES = [
  { id: 'medical', name: 'Medical', description: 'Medical appointments and healthcare visits', color: '#3B82F6' },
  { id: 'legal', name: 'Legal', description: 'Legal appointments and court visits', color: '#EF4444' },
  { id: 'personal', name: 'Personal', description: 'Personal errands and appointments', color: '#10B981' },
  { id: 'program', name: 'Program', description: 'Program-related activities and meetings', color: '#8B5CF6' },
  { id: '12step', name: '12-Step', description: '12-Step program meetings and activities', color: '#F59E0B' },
  { id: 'group', name: 'Group', description: 'Group activities and outings', color: '#06B6D4' },
  { id: 'staff', name: 'Staff', description: 'Staff transportation and meetings', color: '#6B7280' },
  { id: 'carpool', name: 'Carpool', description: 'Carpool and shared transportation', color: '#84CC16' }
];

// Vehicle types configuration
export const VEHICLE_TYPES = [
  { id: 'sedan', name: 'Sedan', capacity: 4, description: 'Standard sedan vehicle' },
  { id: 'suv', name: 'SUV', capacity: 6, description: 'Sport utility vehicle' },
  { id: 'van', name: 'Van', capacity: 8, description: 'Passenger van' },
  { id: 'bus', name: 'Bus', capacity: 15, description: 'Small bus' },
  { id: 'wheelchair_accessible', name: 'Wheelchair Accessible', capacity: 4, description: 'Wheelchair accessible vehicle' }
];

// Trip status configuration
export const TRIP_STATUSES = [
  { id: 'order', name: 'Order', color: '#F59E0B', description: 'Trip order pending driver confirmation' },
  { id: 'scheduled', name: 'Scheduled', color: '#3B82F6', description: 'Trip is scheduled and confirmed' },
  { id: 'confirmed', name: 'Confirmed', color: '#10B981', description: 'Trip is confirmed and ready' },
  { id: 'in_progress', name: 'In Progress', color: '#F59E0B', description: 'Trip is currently in progress' },
  { id: 'completed', name: 'Completed', color: '#059669', description: 'Trip has been completed' },
  { id: 'cancelled', name: 'Cancelled', color: '#EF4444', description: 'Trip has been cancelled' },
  { id: 'no_show', name: 'No Show', color: '#F97316', description: 'Client did not show up for the trip' }
];

// Driver duty status configuration
export const DRIVER_DUTY_STATUSES = [
  { id: 'off_duty', name: 'Off Duty', color: '#6B7280', description: 'Driver is off duty' },
  { id: 'on_duty', name: 'On Duty', color: '#10B981', description: 'Driver is on duty and available' },
  { id: 'on_trip', name: 'On Trip', color: '#F59E0B', description: 'Driver is currently on a trip' },
  { id: 'break', name: 'On Break', color: '#8B5CF6', description: 'Driver is on break' },
  { id: 'unavailable', name: 'Unavailable', color: '#EF4444', description: 'Driver is unavailable' }
];

// Calendar configuration
export const CALENDAR_CONFIG = {
  defaultView: 'week',
  businessHours: {
    start: '07:00',
    end: '19:00'
  },
  timeSlotDuration: '00:30',
  slotLabelInterval: '01:00',
  firstDay: 1, // Monday
  weekends: true,
  timeFormat: '12h', // 12-hour format
  timezone: 'America/Denver' // Mountain Time
};

// Mobile app configuration
export const MOBILE_CONFIG = {
  enableLocationTracking: true,
  enableOfflineMode: true,
  enablePushNotifications: true,
  enableSMSNotifications: true,
  enableEmailNotifications: true
};

// Notification configuration
export const NOTIFICATION_CONFIG = {
  tripReminders: {
    enabled: true,
    advanceTime: 30, // minutes
    methods: ['push', 'sms', 'email']
  },
  driverUpdates: {
    enabled: true,
    methods: ['push', 'sms']
  },
  systemAlerts: {
    enabled: true,
    methods: ['push', 'email']
  }
};

// Legacy compatibility removed - use new hierarchy system instead

// Debug logging
console.log(`🌍 Frontend Environment: ${ENVIRONMENT.nodeEnv}`);
console.log(`🏢 Default Program: ${DEFAULT_PROGRAM_ID}`);
console.log(`🏢 Default Corporate Client: ${DEFAULT_CORPORATE_CLIENT_ID}`);
console.log(`📋 Available Programs: ${AVAILABLE_PROGRAMS.map(program => program.name).join(', ')}`);
console.log(`🏢 Corporate Clients: ${Object.keys(CORPORATE_CLIENTS).join(', ')}`);
console.log(`🚗 Vehicle Types: ${VEHICLE_TYPES.length} types available`);
console.log(`📅 Trip Categories: ${TRIP_CATEGORIES.length} categories available`);
console.log(`🔔 Notifications: ${Object.keys(NOTIFICATION_CONFIG).length} types configured`);