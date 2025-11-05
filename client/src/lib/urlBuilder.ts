/**
 * URL Builder for Hierarchical Routes
 * 
 * Builds URLs based on hierarchy context:
 * - Super Admin: Flat URLs (e.g., /locations)
 * - Corporate Admin: Hierarchical URLs (e.g., /corporate-client/halcyon/locations)
 * - Program Admin/User: Hierarchical URLs with program (e.g., /corporate-client/halcyon/program/halcyon_detox/locations)
 */

export interface HierarchyContext {
  selectedCorporateClient?: string | null;
  selectedProgram?: string | null;
  userRole?: string;
}

/**
 * Builds a hierarchical URL based on the current context
 * @param path - The base path (e.g., '/locations', '/trips')
 * @param context - The hierarchy context
 * @returns The hierarchical URL
 */
export function buildHierarchicalUrl(path: string, context: HierarchyContext): string {
  const { selectedCorporateClient, selectedProgram, userRole } = context;

  // Super admin uses flat URLs
  if (userRole === 'super_admin' && !selectedCorporateClient) {
    return path;
  }

  // Corporate admin uses corporate-client URLs
  if (userRole === 'corporate_admin' && selectedCorporateClient) {
    return `/corporate-client/${selectedCorporateClient}${path}`;
  }

  // Program admin/user with both corporate client and program
  if (selectedCorporateClient && selectedProgram) {
    return `/corporate-client/${selectedCorporateClient}/program/${selectedProgram}${path}`;
  }

  // Corporate admin or super admin viewing a specific corporate client
  if (selectedCorporateClient) {
    return `/corporate-client/${selectedCorporateClient}${path}`;
  }

  // Fallback to flat URL
  return path;
}

/**
 * Parses a hierarchical URL to extract corporate client and program IDs
 * @param path - The current pathname
 * @returns Object with corporateClientId and programId, or null if not hierarchical
 */
export function parseHierarchicalUrl(path: string): {
  corporateClientId?: string;
  programId?: string;
  basePath: string;
} | null {
  // Match: /corporate-client/:corporateClientId/program/:programId/:basePath
  const programMatch = path.match(/^\/corporate-client\/([^/]+)\/program\/([^/]+)(.+)$/);
  if (programMatch) {
    return {
      corporateClientId: programMatch[1],
      programId: programMatch[2],
      basePath: programMatch[3] || '/'
    };
  }

  // Match: /corporate-client/:corporateClientId/:basePath (basePath is optional)
  const corporateMatch = path.match(/^\/corporate-client\/([^/]+)(?:\/(.+))?$/);
  if (corporateMatch) {
    return {
      corporateClientId: corporateMatch[1],
      basePath: corporateMatch[2] ? `/${corporateMatch[2]}` : '/'
    };
  }

  // Not a hierarchical URL
  return null;
}

/**
 * Gets the base path from a hierarchical URL
 * @param path - The current pathname
 * @returns The base path (e.g., '/locations')
 */
export function getBasePath(path: string): string {
  const parsed = parseHierarchicalUrl(path);
  if (parsed) {
    return parsed.basePath;
  }
  return path;
}

