import { createClient } from '@supabase/supabase-js';
import * as express from 'express';

// Supabase clients
const supabaseUrl = process.env.SUPABASE_URL || 'https://iuawurdssgbkbavyyvbs.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YXd1cmRzc2dia2Jhdnl5dmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDU1MzEsImV4cCI6MjA3NDQyMTUzMX0.JLcuSTI1mfEMGu_mP9UBnGQyG33vcoU2SzvKo8olkL4';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YXd1cmRzc2dia2Jhdnl5dmJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg0NTUzMSwiZXhwIjoyMDc0NDIxNTMxfQ.p43LNk28V9bTfvWsbdW8ByZw_lb26-IKoDrHxkvp9fg';

// Client for JWT verification (uses anon key)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for database operations (uses service role key)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface SupabaseAuthenticatedRequest extends express.Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    primaryProgramId: string | null;
    corporateClientId: string | null;
  };
}

// Verify Supabase JWT token and get user data
export async function verifySupabaseToken(token: string) {
  try {
    console.log('🔍 Verifying Supabase token with Supabase...');
    console.log('Token (first 50 chars):', token.substring(0, 50));
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Anon Key (first 20 chars):', supabaseAnonKey.substring(0, 20));
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('❌ Supabase token verification failed:', error?.message);
      return null;
    }

    console.log('✅ Supabase token verified, user ID:', user.id, 'email:', user.email);

    // Get user data from our database using auth_user_id
    console.log('🔍 Looking up user in database with auth_user_id:', user.id);
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select(`
        user_id,
        email,
        role,
        primary_program_id,
        corporate_client_id,
        is_active
      `)
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (dbError || !dbUser) {
      console.log('❌ User not found in database:', user.email, 'Error:', dbError?.message);
      return null;
    }

    console.log('✅ User found in database:', dbUser.email, 'role:', dbUser.role);
    return {
      userId: dbUser.user_id,
      email: dbUser.email,
      role: dbUser.role,
      primaryProgramId: dbUser.primary_program_id,
      corporateClientId: dbUser.corporate_client_id
    };
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return null;
  }
}

// Extract token from Authorization header
export function extractToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Supabase authentication middleware
export async function requireSupabaseAuth(req: SupabaseAuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  try {
    console.log('🔍 requireSupabaseAuth middleware called for:', req.method, req.path);
    const token = extractToken(req);
    
    if (!token) {
      console.log('❌ No token found in request');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    console.log('🔍 Verifying token:', token.substring(0, 20) + '...');
    const user = await verifySupabaseToken(token);
    if (!user) {
      console.log('❌ Invalid or expired token');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Attach user info to request
    req.user = user;
    console.log('✅ Supabase Auth successful:', user.email, user.role);
    
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(401).json({ message: 'Not authenticated' });
  }
}

// Role-based authorization middleware
export function requireSupabaseRole(allowedRoles: string[]) {
  return (req: SupabaseAuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Access denied: User not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied: Requires one of roles: ${allowedRoles.join(', ')}` });
    }
    next();
  };
}
