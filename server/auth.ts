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

export interface AuthenticatedRequest extends SupabaseAuthenticatedRequest {
  currentProgramId?: string;
  currentCorporateClientId?: string;
}

// Permission-based authorization
export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!hasPermission(req.user.role, permission)) {
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