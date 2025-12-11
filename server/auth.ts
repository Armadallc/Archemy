import express from "express";
import bcrypt from "bcrypt";
import { usersStorage, programsStorage, corporateClientsStorage } from "./minimal-supabase";
import { supabase } from "./minimal-supabase";
import type { User } from "@shared/schema";
import { 
  hasPermission, 
  canAccessProgram, 
  canAccessCorporateClient,
  getSessionTimeout,
  type Permission 
} from "./permissions";
import { SupabaseAuthenticatedRequest } from "./supabase-auth";
import { permissionsStorage } from "./permissions-storage";
import { hasPermission as authorizationServiceHasPermission } from "./services/authorizationService";

export interface AuthenticatedRequest extends SupabaseAuthenticatedRequest {
  currentProgramId?: string;
  currentCorporateClientId?: string;
}

// Permission-based authorization with hybrid RBAC support (system + tenant roles)
export function requirePermission(permission: Permission) {
  return async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    let hasAccess = false;

    // Use '*' as resource (matches hardcoded permissions default)
    // The resource field in role_permissions is for future granular control
    const resource = '*';
    
    // Get program_id and corporate_client_id from request if available
    const programId = req.currentProgramId || req.params.programId || req.query.program_id as string | undefined;
    const corporateClientId = req.currentCorporateClientId || req.params.corporateClientId || req.query.corporate_client_id as string | undefined;

    // Try new AuthorizationService first (supports hybrid RBAC)
    try {
      hasAccess = await authorizationServiceHasPermission(
        req.user.userId,
        permission,
        corporateClientId || undefined,
        resource
      );
    } catch (error: any) {
      // If new service fails, try legacy permissionsStorage
      try {
        hasAccess = await permissionsStorage.checkPermission(
          req.user.userId,
          permission,
          resource,
          programId,
          corporateClientId
        );
      } catch (legacyError: any) {
        // If database table doesn't exist or error occurs, fall back to hardcoded permissions
        if (legacyError.code === 'MIGRATION_REQUIRED' || legacyError.code === '42P01' || legacyError.message?.includes('does not exist')) {
          console.warn('⚠️ Database permissions not available, falling back to hardcoded permissions');
          hasAccess = hasPermission(req.user.role, permission);
        } else {
          console.error('Error checking database permissions:', legacyError);
          // On error, fall back to hardcoded permissions for safety
          hasAccess = hasPermission(req.user.role, permission);
        }
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Insufficient permissions",
        requiredPermission: permission,
        userRole: req.user.role
      });
    }

    next();
  };
}

// Program access validation
export function requireProgramAccess(programIdParam: string = 'programId') {
  return async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const programId = req.params[programIdParam] || req.body[programIdParam] || req.query[programIdParam];
    
    if (!programId) {
      return res.status(400).json({ message: `Program ID required in ${programIdParam}` });
    }

    // Super admin can access all programs
    if (req.user.role === 'super_admin') {
      req.currentProgramId = programId;
      return next();
    }

    // For corporate_admin: verify program belongs to their corporate_client_id
    if (req.user.role === 'corporate_admin') {
      if (!req.user.corporateClientId) {
        return res.status(403).json({ 
          message: "Corporate client ID required for corporate admin",
          programId,
          userRole: req.user.role
        });
      }

      // Fetch the program to check its corporate_client_id
      try {
        const program = await programsStorage.getProgram(programId);
        
        if (!program) {
          return res.status(404).json({ 
            message: "Program not found",
            programId
          });
        }

        // Verify the program belongs to the corporate admin's corporate client
        if (program.corporate_client_id !== req.user.corporateClientId) {
          console.error(`❌ SECURITY: Corporate admin ${req.user.userId} attempted to access program ${programId} from different corporate client. User's corporate_client_id: ${req.user.corporateClientId}, Program's corporate_client_id: ${program.corporate_client_id}`);
          return res.status(403).json({ 
            message: "Access denied: Program does not belong to your corporate client",
            programId,
            userCorporateClientId: req.user.corporateClientId,
            programCorporateClientId: program.corporate_client_id,
            userRole: req.user.role
          });
        }

        req.currentProgramId = programId;
        return next();
      } catch (error: any) {
        console.error("Error validating program access:", error);
        return res.status(500).json({ 
          message: "Error validating program access",
          error: error.message
        });
      }
    }

    // For other roles (program_admin, program_user): use existing canAccessProgram logic
    if (!canAccessProgram(req.user.role, req.user.primaryProgramId, null, programId)) {
      return res.status(403).json({ 
        message: "Access denied to program",
        programId,
        userRole: req.user.role
      });
    }

    req.currentProgramId = programId;
    next();
  };
}

// Corporate client access validation
export function requireCorporateClientAccess(corporateClientIdParam: string = 'corporateClientId') {
  return async (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const corporateClientId = req.params[corporateClientIdParam] || req.body[corporateClientIdParam] || req.query[corporateClientIdParam];
    
    if (!corporateClientId) {
      return res.status(400).json({ message: `Corporate client ID required in ${corporateClientIdParam}` });
    }

    if (!canAccessCorporateClient(req.user.role, corporateClientId)) {
      return res.status(403).json({ 
        message: "Access denied to corporate client",
        corporateClientId,
        userRole: req.user.role
      });
    }

    req.currentCorporateClientId = corporateClientId;
    next();
  };
}

// Role-based authorization
export function requireRole(roles: string | string[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Insufficient role",
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
}

// User management functions
export async function createUser(userData: any) {
  try {
    const hashedPassword = await bcrypt.hash(userData.password || 'temp123', 12);
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        user_name: userData.user_name,
        email: userData.email,
        password_hash: hashedPassword,
        role: userData.role || 'program_user',
        primary_program_id: userData.primary_program_id,
        corporate_client_id: userData.corporate_client_id,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(userId: string, updates: any) {
  try {
    const updateData: any = { ...updates };
    
    if (updates.password) {
      updateData.password_hash = await bcrypt.hash(updates.password, 12);
      delete updateData.password;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

export async function deleteUser(userId: string) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}