import React, { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '../lib/supabase';

export interface User {
  user_id: string;
  auth_user_id?: string;
  user_name: string;
  email: string;
  role: 'super_admin' | 'corporate_admin' | 'program_admin' | 'program_user' | 'driver';
  primary_program_id?: string;
  authorized_programs?: string[];
  corporate_client_id?: string; // Added for tenant isolation
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  program?: {
    id: string;
    name: string;
    corporateClient?: {
      id: string;
      name: string;
    };
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  superAdminLogin: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Fetch user data from our backend using Supabase JWT
  const fetchUserData = async (supabaseUser: any, session?: any) => {
    try {
      // Use the session passed in, or get it from Supabase
      let currentSession = session;
      if (!currentSession) {
        const { data: { session: newSession } } = await supabase.auth.getSession();
        currentSession = newSession;
      }
      
      if (!currentSession?.access_token) {
        console.log('❌ No access token found');
        return null;
      }

      // Reduced logging to prevent console spam
      // console.log('🔍 Making request to /api/auth/user with token:', currentSession.access_token.substring(0, 20) + '...');
      
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBaseUrl}/api/auth/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      // console.log('📡 Response status:', response.status); // Disabled to reduce console spam
      
      if (response.ok) {
        const data = await response.json();
        // console.log('✅ User data received:', data); // Disabled to reduce console spam
        return data.user;
      } else {
        const errorText = await response.text();
        // Only log errors, not successful responses
        if (import.meta.env.DEV) {
          console.error('❌ API error:', response.status, errorText);
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      return null;
    }
  };

  const checkAuth = async () => {
    try {
      // console.log('🔍 Starting auth check...'); // Disabled to reduce console spam
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // console.log('🔍 Supabase session found:', session.user.email); // Disabled to reduce console spam
        // console.log('🔍 Calling fetchUserData...'); // Disabled to reduce console spam
        const userData = await fetchUserData(session.user, session);
        if (userData) {
          setUser(userData);
          // console.log('✅ User authenticated:', userData.email); // Disabled to reduce console spam
        } else {
          // Only log errors
          if (import.meta.env.DEV) {
            console.error('❌ Failed to fetch user data');
          }
          setUser(null);
        }
      } else {
        // console.log('❌ No Supabase session'); // Disabled to reduce console spam
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setUser(null);
    } finally {
      // console.log('🔍 Setting isLoading to false'); // Disabled to reduce console spam
      setIsLoading(false);
    }
  };

  // Refresh user data (useful after avatar upload, profile update, etc.)
  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userData = await fetchUserData(session.user, session);
        if (userData) {
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting Supabase login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.log('❌ Supabase login failed:', error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Supabase login successful');
        const userData = await fetchUserData(data.user);
        if (userData) {
          setUser(userData);
          return { success: true };
        } else {
          return { success: false, error: 'Failed to fetch user data' };
        }
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const superAdminLogin = async (password: string) => {
    try {
      console.log('🔐 Attempting super admin login via Supabase');
      
      // Use the super admin email with the provided password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@monarch.com',
        password
      });

      if (error) {
        console.log('❌ Super admin login failed:', error.message);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Super admin login successful');
        const userData = await fetchUserData(data.user);
        if (userData) {
          setUser(userData);
          return { success: true };
        } else {
          return { success: false, error: 'Failed to fetch user data' };
        }
      }

      return { success: false, error: 'Super admin login failed' };
    } catch (error) {
      console.error('❌ Super admin login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.log('⚠️ Supabase logout error:', error.message);
      } else {
        console.log('✅ Logout successful');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      setUser(null);
      setLocation('/login');
    }
  };

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Reduced logging - only log important state changes
      if (import.meta.env.DEV && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        // console.log('🔍 SIGNED_IN event - calling fetchUserData...'); // Disabled to reduce console spam
        const userData = await fetchUserData(session.user, session);
        if (userData) {
          // console.log('✅ User data received in onAuthStateChange:', userData); // Disabled to reduce console spam
          setUser(userData);
        } else {
          // Only log errors
          if (import.meta.env.DEV) {
            console.error('❌ Failed to fetch user data in onAuthStateChange');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        // console.log('🔍 SIGNED_OUT event'); // Disabled to reduce console spam
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    superAdminLogin,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}