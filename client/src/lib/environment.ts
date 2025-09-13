// Frontend environment configuration
const NODE_ENV = import.meta.env.NODE_ENV || 'development';
// Check if we're on the production domain
const isOnProductionDomain = window.location.hostname.includes('replit.app');
// Use actual environment instead of forcing production
const isProduction = NODE_ENV === 'production' || isOnProductionDomain;
const isDevelopment = !isProduction;

// Production: Real Monarch organizations only
const PRODUCTION_ORGANIZATIONS = [
  { id: 'monarch_competency', name: 'Monarch Competency Center' },
  { id: 'monarch_mental_health', name: 'Monarch Mental Health' },
  { id: 'monarch_sober_living', name: 'Monarch Sober Living' },
  { id: 'monarch_launch', name: 'Monarch Launch' }
];

// Development: Demo organizations for testing
const DEVELOPMENT_ORGANIZATIONS = [
  { id: 'littlemonarch_org', name: 'Little Monarch Transport (Demo)' },
  { id: 'demo_org_1', name: 'Demo Organization 1' },
  { id: 'demo_org_2', name: 'Demo Organization 2' }
];

export const ENVIRONMENT = {
  nodeEnv: NODE_ENV,
  isProduction,
  isDevelopment
};

export const DEFAULT_ORGANIZATION_ID = isProduction ? 'monarch_competency' : 'littlemonarch_org';

export const AVAILABLE_ORGANIZATIONS = isProduction ? PRODUCTION_ORGANIZATIONS : DEVELOPMENT_ORGANIZATIONS;

// Helper to validate organization in current environment
export function isValidOrganizationForEnvironment(organizationId: string): boolean {
  return AVAILABLE_ORGANIZATIONS.some(org => org.id === organizationId);
}

console.log(`🌍 Frontend Environment: ${ENVIRONMENT.nodeEnv}`);
console.log(`🏢 Default Organization: ${DEFAULT_ORGANIZATION_ID}`);
console.log(`📋 Available Organizations: ${AVAILABLE_ORGANIZATIONS.map(org => org.name).join(', ')}`);