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

// Token cache to reduce redundant verifications
interface CachedUser {
  user: {
    userId: string;
    email: string;
    role: string;
    primaryProgramId: string | null;
    corporateClientId: string | null;
    authorizedPrograms: string[];
  };
  expiresAt: number; // Timestamp when cache expires
}

const tokenCache = new Map<string, CachedUser>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DEBUG_MODE = process.env.NODE_ENV === 'development' || process.env.DEBUG_AUTH === 'true';

// Helper to decode JWT without verification (to check expiration)
function decodeJWT(token: string): { exp?: number; sub?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch {
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return false; // Can't determine, let Supabase handle it
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  return Date.now() >= expirationTime;
}

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
export async function verifySupabaseToken(token: string, skipCache = false): Promise<{
  userId: string;
  email: string;
  role: string;
  primaryProgramId: string | null;
  corporateClientId: string | null;
  authorizedPrograms: string[];
} | null> {
  try {
    // Check cache first (unless explicitly skipping)
    if (!skipCache) {
      const cached = tokenCache.get(token);
      if (cached && cached.expiresAt > Date.now()) {
        if (DEBUG_MODE) {
          console.log('✅ [BACKEND AUTH] Using cached token verification for:', cached.user.email);
        }
        return cached.user;
      }
      // Remove expired cache entry
      if (cached) {
        tokenCache.delete(token);
      }
    }

    // Check if token is expired before making API call
    if (isTokenExpired(token)) {
      if (DEBUG_MODE) {
        console.log('❌ [BACKEND AUTH] Token is expired (checked before verification)');
      }
      return null;
    }

    if (DEBUG_MODE) {
      console.log('🔍 [BACKEND AUTH] Verifying Supabase token with Supabase...');
      console.log('🔍 [BACKEND AUTH] Token (first 50 chars):', token.substring(0, 50));
      console.log('🔍 [BACKEND AUTH] Token length:', token.length);
    }
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      // Handle expired token specifically
      if (error.status === 403 || error.code === 'bad_jwt' || error.message?.includes('expired')) {
        if (DEBUG_MODE) {
          console.log('❌ [BACKEND AUTH] Token expired or invalid:', error.message);
        }
        return null;
      }
      if (DEBUG_MODE) {
        console.log('❌ [BACKEND AUTH] Supabase token verification error:', error.message);
        console.log('❌ [BACKEND AUTH] Error code:', error.status);
      }
      return null;
    }
    
    if (!user) {
      if (DEBUG_MODE) {
        console.log('❌ [BACKEND AUTH] Supabase token verification returned no user');
      }
      return null;
    }

    if (DEBUG_MODE) {
      console.log('✅ [BACKEND AUTH] Supabase token verified, user ID:', user.id, 'email:', user.email);
    }

    // Get user data from our database using auth_user_id
    if (DEBUG_MODE) {
      console.log('🔍 [BACKEND AUTH] Looking up user in database with auth_user_id:', user.id);
    }
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from('users')
      .select(`
        user_id,
        email,
        role,
        primary_program_id,
        corporate_client_id,
        authorized_programs,
        is_active
      `)
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .single();

    if (dbError) {
      if (DEBUG_MODE) {
        console.log('❌ [BACKEND AUTH] Database query error:', dbError.message);
        console.log('❌ [BACKEND AUTH] Database error code:', dbError.code);
      }
      return null;
    }
    
    if (!dbUser) {
      if (DEBUG_MODE) {
        console.log('❌ [BACKEND AUTH] User not found in database for auth_user_id:', user.id);
      }
      return null;
    }

    if (DEBUG_MODE) {
      console.log('✅ [BACKEND AUTH] User found in database:', dbUser.email, 'role:', dbUser.role);
    }

    const userData = {
      userId: dbUser.user_id,
      email: dbUser.email,
      role: dbUser.role,
      primaryProgramId: dbUser.primary_program_id,
      corporateClientId: dbUser.corporate_client_id,
      authorizedPrograms: dbUser.authorized_programs || []
    };

    // Cache the result
    tokenCache.set(token, {
      user: userData,
      expiresAt: Date.now() + CACHE_TTL
    });

    // Clean up old cache entries periodically (every 100 verifications)
    if (tokenCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of tokenCache.entries()) {
        if (value.expiresAt <= now) {
          tokenCache.delete(key);
        }
      }
    }

    return userData;
  } catch (error) {
    console.error('❌ [BACKEND AUTH] Token verification exception:', error);
    if (error instanceof Error && DEBUG_MODE) {
      console.error('❌ [BACKEND AUTH] Error stack:', error.stack);
    }
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
    if (DEBUG_MODE) {
      console.log('🔍 [BACKEND AUTH] requireSupabaseAuth middleware called for:', req.method, req.path);
    }
    
    const token = extractToken(req);
    
    if (!token) {
      if (DEBUG_MODE) {
        console.log('❌ [BACKEND AUTH] No token found in request');
      }
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if token is expired before verification
    if (isTokenExpired(token)) {
      if (DEBUG_MODE) {
        console.log('❌ [BACKEND AUTH] Token is expired');
      }
      return res.status(401).json({ message: 'Token expired' });
    }

    if (DEBUG_MODE) {
      console.log('🔍 [BACKEND AUTH] Verifying token...');
    }
    const user = await verifySupabaseToken(token);
    if (!user) {
      if (DEBUG_MODE) {
        console.log('❌ [BACKEND AUTH] Invalid or expired token - verification returned null');
      }
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Attach user info to request
    req.user = user;
    if (DEBUG_MODE) {
      console.log('✅ [BACKEND AUTH] Supabase Auth successful:', user.email, user.role);
    }
    
    next();
  } catch (error) {
    console.error('❌ [BACKEND AUTH] Auth middleware error:', error);
    if (error instanceof Error && DEBUG_MODE) {
      console.error('❌ [BACKEND AUTH] Error stack:', error.stack);
    }
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

// Utility function to clear token cache (useful for testing or forced refresh)
export function clearTokenCache(): void {
  tokenCache.clear();
  if (DEBUG_MODE) {
    console.log('✅ [BACKEND AUTH] Token cache cleared');
  }
}

// Get cache statistics (useful for monitoring)
export function getCacheStats(): { size: number; entries: number } {
  const now = Date.now();
  let validEntries = 0;
  for (const value of tokenCache.values()) {
    if (value.expiresAt > now) {
      validEntries++;
    }
  }
  return {
    size: tokenCache.size,
    entries: validEntries
  };
}
