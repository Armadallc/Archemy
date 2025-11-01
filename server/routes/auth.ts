import express from "express";
import { createClient } from '@supabase/supabase-js';
import { supabase } from "../db";
import { 
  requireSupabaseAuth, 
  SupabaseAuthenticatedRequest
} from "../supabase-auth";

const router = express.Router();

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Mobile authentication endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Mobile Login: Received credentials:', { email, password: password ? password.substring(0, 3) + '***' : 'missing' });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Create anon client for authentication
    const supabaseAnon = createClient(
      process.env.SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Authenticate with Supabase
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log('Supabase auth error:', error.message);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!data.user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Get user data from database
    console.log('Looking up user with auth_user_id:', data.user.id);
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        user_id,
        auth_user_id,
        user_name,
        email,
        role,
        primary_program_id,
        corporate_client_id,
        avatar_url,
        is_active
      `)
      .eq('auth_user_id', data.user.id)
      .single();

    console.log('User lookup result:', { userData, userError });

    if (userError || !userData) {
      console.log('User lookup error:', userError);
      return res.status(404).json({ 
        error: 'User not found in database',
        debug: {
          authUserId: data.user.id,
          userError: userError?.message,
          userData: userData
        }
      });
    }

    res.json({
      user: userData,
      token: data.session?.access_token,
      sessionId: data.session?.access_token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Supabase Auth routes - handled by frontend Supabase client
router.get("/user", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get full user data from database
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        user_id,
        auth_user_id,
        user_name,
        email,
        role,
        primary_program_id,
        corporate_client_id,
        avatar_url,
        is_active,
        created_at,
        updated_at
      `)
      .eq('user_id', req.user.userId)
      .single();

    if (error || !user) {
      console.error("Error fetching user:", error);
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error in /auth/user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Test database schema endpoint
router.get('/test-schema', async (req, res) => {
  try {
    // Try to get user by email first
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@monarch.com')
      .single();
    
    // Try to get all users to see the schema
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    res.json({
      userByEmail: userByEmail || null,
      emailError: emailError?.message || null,
      allUsers: allUsers || [],
      allError: allError?.message || null
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Test Supabase auth endpoint
router.post('/test-auth', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Create anon client for authentication
    const supabaseAnon = createClient(
      process.env.SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    // Test authentication
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    });

    res.json({
      success: !error,
      error: error?.message || null,
      user: data?.user ? {
        id: data.user.id,
        email: data.user.email
      } : null,
      session: data?.session ? {
        access_token: data.session.access_token ? 'present' : 'missing'
      } : null
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;










