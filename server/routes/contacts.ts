import express from "express";
import { 
  requireSupabaseAuth,
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { usersStorage, supabase } from "../minimal-supabase";

const router = express.Router();

/**
 * GET /api/contacts
 * Get all contacts (users) - alias for /api/users
 * Access: super_admin, corporate_admin
 */
router.get("/", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Super admin can see all users
    // Corporate admin can only see users in their corporate client
    if (req.user.role === 'super_admin') {
      const users = await usersStorage.getAllUsers();
      return res.json(users);
    } else if (req.user.role === 'corporate_admin' && req.user.corporateClientId) {
      // Filter users by corporate client
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          programs:primary_program_id (
            id,
            name,
            corporate_clients:corporate_client_id (
              id,
              name
            )
          ),
          corporate_clients!corporate_client_id (
            id,
            name
          )
        `)
        .eq('corporate_client_id', req.user.corporateClientId);
      
      if (error) throw error;
      
      // Enrich data with corporate client names if relationship didn't work
      const enrichedData = await Promise.all((data || []).map(async (user: any) => {
        if (user.corporate_client_id && !user.corporate_clients) {
          try {
            const { data: corpClient } = await supabase
              .from('corporate_clients')
              .select('id, name')
              .eq('id', user.corporate_client_id)
              .single();
            if (corpClient) {
              user.corporate_clients = corpClient;
            }
          } catch (err) {
            console.warn(`Could not fetch corporate client for user ${user.user_id}:`, err);
          }
        }
        return user;
      }));
      
      return res.json(enrichedData);
    } else {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
  } catch (error: any) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ 
      message: "Failed to fetch contacts",
      error: error.message 
    });
  }
});

/**
 * GET /api/contacts/program/:programId
 * Get contacts (users) by program
 * Access: super_admin, corporate_admin, program_admin
 */
router.get("/program/:programId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin', 'program_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { programId } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        corporate_clients:corporate_client_id (
          id,
          name
        )
      `)
      .eq('primary_program_id', programId);
    
    if (error) throw error;
    
    // Enrich data with corporate client names if relationship didn't work
    const enrichedData = await Promise.all((data || []).map(async (user: any) => {
      if (user.corporate_client_id && !user.corporate_clients) {
        try {
          const { data: corpClient } = await supabase
            .from('corporate_clients')
            .select('id, name')
            .eq('id', user.corporate_client_id)
            .single();
          if (corpClient) {
            user.corporate_clients = corpClient;
          }
        } catch (err) {
          console.warn(`Could not fetch corporate client for user ${user.user_id}:`, err);
        }
      }
      return user;
    }));
    
    res.json(enrichedData);
  } catch (error: any) {
    console.error("Error fetching contacts by program:", error);
    res.status(500).json({ 
      message: "Failed to fetch contacts",
      error: error.message 
    });
  }
});

/**
 * GET /api/contacts/corporate-client/:corporateClientId
 * Get contacts (users) by corporate client
 * Access: super_admin, corporate_admin
 */
router.get("/corporate-client/:corporateClientId", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { corporateClientId } = req.params;

    // Corporate admin can only see users in their own corporate client
    if (req.user.role === 'corporate_admin' && req.user.corporateClientId !== corporateClientId) {
      return res.status(403).json({ message: "You can only view users in your own corporate client" });
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        programs:primary_program_id (
          id,
          name,
          corporate_clients:corporate_client_id (
            id,
            name
          )
        ),
        corporate_clients:corporate_client_id (
          id,
          name
        )
      `)
      .eq('corporate_client_id', corporateClientId);
    
    if (error) throw error;
    
    // Enrich data with corporate client names if relationship didn't work
    const enrichedData = await Promise.all((data || []).map(async (user: any) => {
      if (user.corporate_client_id && !user.corporate_clients) {
        try {
          const { data: corpClient } = await supabase
            .from('corporate_clients')
            .select('id, name')
            .eq('id', user.corporate_client_id)
            .single();
          if (corpClient) {
            user.corporate_clients = corpClient;
          }
        } catch (err) {
          console.warn(`Could not fetch corporate client for user ${user.user_id}:`, err);
        }
      }
      return user;
    }));
    
    res.json(enrichedData);
  } catch (error: any) {
    console.error("Error fetching contacts by corporate client:", error);
    res.status(500).json({ 
      message: "Failed to fetch contacts",
      error: error.message 
    });
  }
});

export default router;












