/**
 * Tenant Roles Management API
 * 
 * Endpoints for managing custom tenant roles created by Corporate Admins.
 * Supports creating, updating, deleting roles and managing their permissions.
 */

import express from "express";
import { 
  requireSupabaseAuth,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { requirePermission, AuthenticatedRequest } from "../auth";
import { PERMISSIONS } from "../permissions";
import { supabase } from "../minimal-supabase";
import { corporateClientsStorage } from "../minimal-supabase";
import { z } from "zod";

const router = express.Router();

// Validation schemas
const createTenantRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  corporate_client_id: z.string().min(1),
  is_active: z.boolean().optional().default(true),
});

const updateTenantRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

const assignPermissionSchema = z.object({
  permission: z.string().min(1),
  resource: z.string().default('*'),
  program_id: z.string().optional().nullable(),
  corporate_client_id: z.string().optional().nullable(),
});

const assignRoleToUserSchema = z.object({
  tenant_role_id: z.string().min(1),
  corporate_client_id: z.string().min(1),
});

// ============================================================================
// GET /api/tenant-roles
// List all tenant roles for the current corporate client
// ============================================================================
router.get(
  "/",
  requireSupabaseAuth,
  requirePermission(PERMISSIONS.VIEW_USERS),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get corporate_client_id from query, params, or user's context
      const corporateClientId = 
        req.query.corporate_client_id as string ||
        req.params.corporateClientId ||
        req.currentCorporateClientId ||
        req.user.corporateClientId;

      if (!corporateClientId) {
        return res.status(400).json({ 
          message: "corporate_client_id is required" 
        });
      }

      // Super admin can view all, others only their corporate client
      if (req.user.role !== 'super_admin' && req.user.corporateClientId !== corporateClientId) {
        return res.status(403).json({ 
          message: "Access denied to this corporate client" 
        });
      }

      // Fetch tenant roles
      let query = supabase
        .from('tenant_roles')
        .select('*')
        .eq('corporate_client_id', corporateClientId)
        .order('name', { ascending: true });

      const { data: roles, error } = await query;

      if (error) {
        console.error('Error fetching tenant roles:', error);
        return res.status(500).json({ 
          message: "Failed to fetch tenant roles",
          error: error.message 
        });
      }

      res.json(roles || []);
    } catch (error: any) {
      console.error('Error in GET /api/tenant-roles:', error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// ============================================================================
// GET /api/tenant-roles/:id
// Get a specific tenant role by ID
// ============================================================================
router.get(
  "/:id",
  requireSupabaseAuth,
  requirePermission(PERMISSIONS.VIEW_USERS),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;

      // Fetch tenant role
      const { data: role, error } = await supabase
        .from('tenant_roles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !role) {
        return res.status(404).json({ 
          message: "Tenant role not found" 
        });
      }

      // Check access: super admin or same corporate client
      if (req.user.role !== 'super_admin' && req.user.corporateClientId !== role.corporate_client_id) {
        return res.status(403).json({ 
          message: "Access denied to this tenant role" 
        });
      }

      res.json(role);
    } catch (error: any) {
      console.error('Error in GET /api/tenant-roles/:id:', error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// ============================================================================
// POST /api/tenant-roles
// Create a new tenant role
// ============================================================================
router.post(
  "/",
  requireSupabaseAuth,
  requirePermission(PERMISSIONS.MANAGE_USERS),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Validate request body
      const validationResult = createTenantRoleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: validationResult.error.errors 
        });
      }

      const { name, description, corporate_client_id, is_active } = validationResult.data;

      // Check access: super admin or same corporate client
      if (req.user.role !== 'super_admin' && req.user.corporateClientId !== corporate_client_id) {
        return res.status(403).json({ 
          message: "Access denied to create roles for this corporate client" 
        });
      }

      // Verify corporate client exists
      const corporateClient = await corporateClientsStorage.getCorporateClient(corporate_client_id);
      if (!corporateClient) {
        return res.status(404).json({ 
          message: "Corporate client not found" 
        });
      }

      // Create tenant role
      const { data: role, error } = await supabase
        .from('tenant_roles')
        .insert({
          name,
          description: description || null,
          corporate_client_id,
          is_active: is_active ?? true,
          created_by: req.user.userId,
        })
        .select()
        .single();

      if (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
          return res.status(409).json({ 
            message: "A role with this name already exists for this corporate client" 
          });
        }
        console.error('Error creating tenant role:', error);
        return res.status(500).json({ 
          message: "Failed to create tenant role",
          error: error.message 
        });
      }

      res.status(201).json(role);
    } catch (error: any) {
      console.error('Error in POST /api/tenant-roles:', error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// ============================================================================
// PUT /api/tenant-roles/:id
// Update a tenant role
// ============================================================================
router.put(
  "/:id",
  requireSupabaseAuth,
  requirePermission(PERMISSIONS.MANAGE_USERS),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;

      // Validate request body
      const validationResult = updateTenantRoleSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: validationResult.error.errors 
        });
      }

      // Fetch existing role to check access
      const { data: existingRole, error: fetchError } = await supabase
        .from('tenant_roles')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingRole) {
        return res.status(404).json({ 
          message: "Tenant role not found" 
        });
      }

      // Check access: super admin or same corporate client
      if (req.user.role !== 'super_admin' && req.user.corporateClientId !== existingRole.corporate_client_id) {
        return res.status(403).json({ 
          message: "Access denied to update this tenant role" 
        });
      }

      // Update role
      const updateData: any = {};
      if (validationResult.data.name !== undefined) updateData.name = validationResult.data.name;
      if (validationResult.data.description !== undefined) updateData.description = validationResult.data.description;
      if (validationResult.data.is_active !== undefined) updateData.is_active = validationResult.data.is_active;

      const { data: updatedRole, error: updateError } = await supabase
        .from('tenant_roles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        // Check for unique constraint violation
        if (updateError.code === '23505') {
          return res.status(409).json({ 
            message: "A role with this name already exists for this corporate client" 
          });
        }
        console.error('Error updating tenant role:', updateError);
        return res.status(500).json({ 
          message: "Failed to update tenant role",
          error: updateError.message 
        });
      }

      res.json(updatedRole);
    } catch (error: any) {
      console.error('Error in PUT /api/tenant-roles/:id:', error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// ============================================================================
// DELETE /api/tenant-roles/:id
// Delete a tenant role (soft delete by setting is_active=false)
// ============================================================================
router.delete(
  "/:id",
  requireSupabaseAuth,
  requirePermission(PERMISSIONS.MANAGE_USERS),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;

      // Fetch existing role to check access
      const { data: existingRole, error: fetchError } = await supabase
        .from('tenant_roles')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingRole) {
        return res.status(404).json({ 
          message: "Tenant role not found" 
        });
      }

      // Check access: super admin or same corporate client
      if (req.user.role !== 'super_admin' && req.user.corporateClientId !== existingRole.corporate_client_id) {
        return res.status(403).json({ 
          message: "Access denied to delete this tenant role" 
        });
      }

      // Check if role is assigned to any users
      const { data: usersWithRole, error: usersError } = await supabase
        .from('users')
        .select('user_id, user_name, email')
        .eq('tenant_role_id', id)
        .limit(5);

      if (usersError) {
        console.error('Error checking users with role:', usersError);
      }

      if (usersWithRole && usersWithRole.length > 0) {
        return res.status(409).json({ 
          message: "Cannot delete role: it is assigned to users",
          users: usersWithRole.map(u => ({ id: u.user_id, name: u.user_name, email: u.email }))
        });
      }

      // Soft delete by setting is_active=false
      const { data: deletedRole, error: deleteError } = await supabase
        .from('tenant_roles')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (deleteError) {
        console.error('Error deleting tenant role:', deleteError);
        return res.status(500).json({ 
          message: "Failed to delete tenant role",
          error: deleteError.message 
        });
      }

      res.json({ 
        message: "Tenant role deleted successfully",
        role: deletedRole 
      });
    } catch (error: any) {
      console.error('Error in DELETE /api/tenant-roles/:id:', error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// ============================================================================
// GET /api/tenant-roles/:id/permissions
// Get all permissions for a tenant role
// ============================================================================
router.get(
  "/:id/permissions",
  requireSupabaseAuth,
  requirePermission(PERMISSIONS.VIEW_USERS),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;

      // Fetch tenant role to check access
      const { data: role, error: roleError } = await supabase
        .from('tenant_roles')
        .select('*')
        .eq('id', id)
        .single();

      if (roleError || !role) {
        return res.status(404).json({ 
          message: "Tenant role not found" 
        });
      }

      // Check access: super admin or same corporate client
      if (req.user.role !== 'super_admin' && req.user.corporateClientId !== role.corporate_client_id) {
        return res.status(403).json({ 
          message: "Access denied to view this tenant role's permissions" 
        });
      }

      // Fetch permissions
      const { data: permissions, error: permError } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', id)
        .eq('role_type', 'tenant')
        .order('permission', { ascending: true });

      if (permError) {
        console.error('Error fetching tenant role permissions:', permError);
        return res.status(500).json({ 
          message: "Failed to fetch permissions",
          error: permError.message 
        });
      }

      res.json(permissions || []);
    } catch (error: any) {
      console.error('Error in GET /api/tenant-roles/:id/permissions:', error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// ============================================================================
// POST /api/tenant-roles/:id/permissions
// Add a permission to a tenant role
// ============================================================================
router.post(
  "/:id/permissions",
  requireSupabaseAuth,
  requirePermission(PERMISSIONS.MANAGE_USERS),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;

      // Validate request body
      const validationResult = assignPermissionSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation error",
          errors: validationResult.error.errors 
        });
      }

      const { permission, resource, program_id, corporate_client_id } = validationResult.data;

      // Fetch tenant role to check access
      const { data: role, error: roleError } = await supabase
        .from('tenant_roles')
        .select('*')
        .eq('id', id)
        .single();

      if (roleError || !role) {
        return res.status(404).json({ 
          message: "Tenant role not found" 
        });
      }

      // Check access: super admin or same corporate client
      if (req.user.role !== 'super_admin' && req.user.corporateClientId !== role.corporate_client_id) {
        return res.status(403).json({ 
          message: "Access denied to manage this tenant role's permissions" 
        });
      }

      // Use role's corporate_client_id if not provided
      const finalCorporateClientId = corporate_client_id || role.corporate_client_id;

      // Insert permission
      const { data: newPermission, error: insertError } = await supabase
        .from('role_permissions')
        .insert({
          role: id,
          role_type: 'tenant',
          permission,
          resource: resource || '*',
          program_id: program_id || null,
          corporate_client_id: finalCorporateClientId || null,
        })
        .select()
        .single();

      if (insertError) {
        // Check for unique constraint violation
        if (insertError.code === '23505') {
          return res.status(409).json({ 
            message: "This permission already exists for this role" 
          });
        }
        console.error('Error adding permission:', insertError);
        return res.status(500).json({ 
          message: "Failed to add permission",
          error: insertError.message 
        });
      }

      res.status(201).json(newPermission);
    } catch (error: any) {
      console.error('Error in POST /api/tenant-roles/:id/permissions:', error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// ============================================================================
// DELETE /api/tenant-roles/:id/permissions/:permissionId
// Remove a permission from a tenant role
// ============================================================================
router.delete(
  "/:id/permissions/:permissionId",
  requireSupabaseAuth,
  requirePermission(PERMISSIONS.MANAGE_USERS),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id, permissionId } = req.params;

      // Fetch tenant role to check access
      const { data: role, error: roleError } = await supabase
        .from('tenant_roles')
        .select('*')
        .eq('id', id)
        .single();

      if (roleError || !role) {
        return res.status(404).json({ 
          message: "Tenant role not found" 
        });
      }

      // Check access: super admin or same corporate client
      if (req.user.role !== 'super_admin' && req.user.corporateClientId !== role.corporate_client_id) {
        return res.status(403).json({ 
          message: "Access denied to manage this tenant role's permissions" 
        });
      }

      // Delete permission
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('id', permissionId)
        .eq('role', id)
        .eq('role_type', 'tenant');

      if (deleteError) {
        console.error('Error deleting permission:', deleteError);
        return res.status(500).json({ 
          message: "Failed to delete permission",
          error: deleteError.message 
        });
      }

      res.json({ message: "Permission removed successfully" });
    } catch (error: any) {
      console.error('Error in DELETE /api/tenant-roles/:id/permissions/:permissionId:', error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

// ============================================================================
// POST /api/tenant-roles/:id/permissions/bulk
// Bulk update permissions for a tenant role
// ============================================================================
router.post(
  "/:id/permissions/bulk",
  requireSupabaseAuth,
  requirePermission(PERMISSIONS.MANAGE_USERS),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { id } = req.params;
      const { permissions } = req.body; // Array of { permission, resource, program_id?, corporate_client_id? }

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ 
          message: "permissions must be an array" 
        });
      }

      // Fetch tenant role to check access
      const { data: role, error: roleError } = await supabase
        .from('tenant_roles')
        .select('*')
        .eq('id', id)
        .single();

      if (roleError || !role) {
        return res.status(404).json({ 
          message: "Tenant role not found" 
        });
      }

      // Check access: super admin or same corporate client
      if (req.user.role !== 'super_admin' && req.user.corporateClientId !== role.corporate_client_id) {
        return res.status(403).json({ 
          message: "Access denied to manage this tenant role's permissions" 
        });
      }

      // Delete existing permissions for this role
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role', id)
        .eq('role_type', 'tenant');

      if (deleteError) {
        console.error('Error deleting existing permissions:', deleteError);
        return res.status(500).json({ 
          message: "Failed to update permissions",
          error: deleteError.message 
        });
      }

      // Insert new permissions
      if (permissions.length > 0) {
        const permissionsToInsert = permissions.map((perm: any) => ({
          role: id,
          role_type: 'tenant',
          permission: perm.permission,
          resource: perm.resource || '*',
          program_id: perm.program_id || null,
          corporate_client_id: perm.corporate_client_id || role.corporate_client_id || null,
        }));

        const { data: insertedPermissions, error: insertError } = await supabase
          .from('role_permissions')
          .insert(permissionsToInsert)
          .select();

        if (insertError) {
          console.error('Error inserting permissions:', insertError);
          return res.status(500).json({ 
            message: "Failed to update permissions",
            error: insertError.message 
          });
        }

        res.json({ 
          message: "Permissions updated successfully",
          permissions: insertedPermissions 
        });
      } else {
        res.json({ 
          message: "All permissions removed successfully",
          permissions: [] 
        });
      }
    } catch (error: any) {
      console.error('Error in POST /api/tenant-roles/:id/permissions/bulk:', error);
      res.status(500).json({ 
        message: "Internal server error",
        error: error.message 
      });
    }
  }
);

export default router;







