import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useHierarchy } from './useHierarchy';

// Local type definition (avoid importing from server)
export interface UserScope {
  corporateClients: string[];
  programs: string[];
  locations: string[];
  canSeeAllOrganizations: boolean;
  canSeeAllPrograms: boolean;
  canSeeAllLocations: boolean;
}

export function useUserScope(): UserScope | null {
  const { user } = useAuth();
  const { selectedCorporateClient, selectedProgram } = useHierarchy();

  return useMemo(() => {
    if (!user) {
      return null;
    }

    // Build scope based on user role and current hierarchy context
    switch (user.role) {
      case 'super_admin':
        return {
          corporateClients: [],
          programs: [],
          locations: [],
          canSeeAllOrganizations: true,
          canSeeAllPrograms: true,
          canSeeAllLocations: true,
        };

      case 'corporate_admin':
        return {
          corporateClients: user.corporate_client_id ? [user.corporate_client_id] : [],
          programs: [],
          locations: [],
          canSeeAllOrganizations: false,
          canSeeAllPrograms: true, // Within their corporate client
          canSeeAllLocations: true,
        };

      case 'program_admin':
      case 'program_user': {
        const programIds: string[] = [];
        if (user.primary_program_id) {
          programIds.push(user.primary_program_id);
        }
        if (user.authorized_programs && Array.isArray(user.authorized_programs)) {
          programIds.push(...user.authorized_programs.filter(p => p && !programIds.includes(p)));
        }

        return {
          corporateClients: user.corporate_client_id ? [user.corporate_client_id] : [],
          programs: programIds,
          locations: [],
          canSeeAllOrganizations: false,
          canSeeAllPrograms: false,
          canSeeAllLocations: true, // Within their programs
        };
      }

      case 'driver':
        return {
          corporateClients: [],
          programs: [],
          locations: [],
          canSeeAllOrganizations: false,
          canSeeAllPrograms: false,
          canSeeAllLocations: false,
        };

      default:
        return {
          corporateClients: [],
          programs: [],
          locations: [],
          canSeeAllOrganizations: false,
          canSeeAllPrograms: false,
          canSeeAllLocations: false,
        };
    }
  }, [user, selectedCorporateClient, selectedProgram]);
}

