// Environment-based configuration for demo vs production data separation
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Production: Real Monarch organizations only
const PRODUCTION_ORGANIZATIONS = [
  'monarch_competency',
  'monarch_mental_health', 
  'monarch_sober_living',
  'monarch_launch'
];

// Development: Demo organizations for testing
const DEVELOPMENT_ORGANIZATIONS = [
  'littlemonarch_org',
  'demo_org_1',
  'demo_org_2'
];

// Default organizations based on environment
export const DEFAULT_ORGANIZATION = isProduction ? 'monarch_competency' : 'littlemonarch_org';

export const ALLOWED_ORGANIZATIONS = isProduction ? PRODUCTION_ORGANIZATIONS : DEVELOPMENT_ORGANIZATIONS;

// Environment detection
export const ENVIRONMENT = {
  isDevelopment,
  isProduction,
  nodeEnv: process.env.NODE_ENV || 'development'
};

// Data filtering for organization-specific queries
export function filterByEnvironment<T extends { organization_id?: string; primary_organization_id?: string }>(
  data: T[], 
  organizationField: 'organization_id' | 'primary_organization_id' = 'organization_id'
): T[] {
  if (!isProduction) {
    // Development: Allow all data
    return data;
  }
  
  // Production: Filter to only real Monarch organizations
  return data.filter(item => {
    const orgId = item[organizationField];
    return orgId && PRODUCTION_ORGANIZATIONS.includes(orgId);
  });
}

// Validate organization access based on environment
export function isValidOrganization(organizationId: string): boolean {
  return ALLOWED_ORGANIZATIONS.includes(organizationId);
}

console.log(`🌍 Environment: ${ENVIRONMENT.nodeEnv}`);
console.log(`🏢 Default Organization: ${DEFAULT_ORGANIZATION}`);
console.log(`📋 Allowed Organizations: ${ALLOWED_ORGANIZATIONS.join(', ')}`);