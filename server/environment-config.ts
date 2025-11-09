// Environment-based configuration for new architectural blueprint
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

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
  }
};

// Production: Real Monarch programs only
const PRODUCTION_PROGRAMS = [
  'monarch_competency',
  'monarch_mental_health', 
  'monarch_sober_living',
  'monarch_launch'
];

// Development: Demo programs for testing
const DEVELOPMENT_PROGRAMS = [
  'demo_program_1',
  'demo_program_2',
  'demo_program_3'
];

// Default program based on environment
export const DEFAULT_PROGRAM = isProduction ? 'monarch_competency' : 'demo_program_1';

// Default corporate client
export const DEFAULT_CORPORATE_CLIENT = 'monarch';

export const ALLOWED_PROGRAMS = isProduction ? PRODUCTION_PROGRAMS : DEVELOPMENT_PROGRAMS;

// Environment detection
export const ENVIRONMENT = {
  isDevelopment,
  isProduction,
  nodeEnv: process.env.NODE_ENV || 'development'
};

// Data filtering for program-specific queries
export function filterByEnvironment<T extends { program_id?: string; primary_program_id?: string }>(
  data: T[], 
  programField: 'program_id' | 'primary_program_id' = 'program_id'
): T[] {
  if (!isProduction) {
    // Development: Allow all data
    return data;
  }
  
  // Production: Filter to only real Monarch programs
  return data.filter(item => {
    const programId = item[programField];
    return programId && PRODUCTION_PROGRAMS.includes(programId);
  });
}

// Validate program access based on environment
export function isValidProgram(programId: string): boolean {
  return ALLOWED_PROGRAMS.includes(programId);
}

// Validate corporate client access
export function isValidCorporateClient(corporateClientId: string): boolean {
  return Object.keys(CORPORATE_CLIENTS).includes(corporateClientId);
}

// Get corporate client for a program
export function getCorporateClientForProgram(programId: string): string | null {
  for (const [clientId, client] of Object.entries(CORPORATE_CLIENTS)) {
    if (client.programs.includes(programId)) {
      return clientId;
    }
  }
  return null;
}

// Get all programs for a corporate client
export function getProgramsForCorporateClient(corporateClientId: string): string[] {
  const client = CORPORATE_CLIENTS[corporateClientId as keyof typeof CORPORATE_CLIENTS];
  return client ? client.programs : [];
}

// Check if user can access program based on corporate client
export function canAccessProgramByCorporateClient(
  userRole: string,
  userCorporateClientId: string | null,
  requestedProgramId: string
): boolean {
  // Super admin can access all programs
  if (userRole === 'super_admin') {
    return true;
  }
  
  // Corporate admin can access programs within their corporate client
  if (userRole === 'corporate_admin' && userCorporateClientId) {
    const userPrograms = getProgramsForCorporateClient(userCorporateClientId);
    return userPrograms.includes(requestedProgramId);
  }
  
  // Other roles are handled by program-level permissions
  return false;
}

// Get role-based data access scope
export function getDataAccessScope(userRole: string, userCorporateClientId?: string | null): {
  corporateClients: string[];
  programs: string[];
  locations: string[];
} {
  switch (userRole) {
    case 'super_admin':
      return {
        corporateClients: Object.keys(CORPORATE_CLIENTS),
        programs: ALLOWED_PROGRAMS,
        locations: [] // All locations
      };
      
    case 'corporate_admin':
      if (userCorporateClientId) {
        return {
          corporateClients: [userCorporateClientId],
          programs: getProgramsForCorporateClient(userCorporateClientId),
          locations: [] // All locations within corporate client
        };
      }
      return {
        corporateClients: [],
        programs: [],
        locations: []
      };
      
    case 'program_admin':
    case 'program_user':
    case 'driver':
      return {
        corporateClients: [],
        programs: [], // Will be set based on user's primary_program_id and authorized_programs
        locations: [] // Will be set based on user's programs
      };
      
    default:
      return {
        corporateClients: [],
        programs: [],
        locations: []
      };
  }
}

// Legacy compatibility removed - frontend fully migrated to hierarchical system

console.log(`🌍 Environment: ${ENVIRONMENT.nodeEnv}`);
console.log(`🏢 Default Program: ${DEFAULT_PROGRAM}`);
console.log(`🏢 Default Corporate Client: ${DEFAULT_CORPORATE_CLIENT}`);
console.log(`📋 Allowed Programs: ${ALLOWED_PROGRAMS.join(', ')}`);
console.log(`🏢 Corporate Clients: ${Object.keys(CORPORATE_CLIENTS).join(', ')}`);