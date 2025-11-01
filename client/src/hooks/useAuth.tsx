import React, { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iuawurdssgbkbavyyvbs.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YXd1cmRzc2dia2Jhdnl5dmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDU1MzEsImV4cCI6MjA3NDQyMTUzMX0.JLcuSTI1mfEMGu_mP9UBnGQyG33vcoU2SzvKo8olkL4';

if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
  console.warn('⚠️ Using placeholder Supabase anon key. Please set VITE_SUPABASE_ANON_KEY in your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  user_id: string;
  auth_user_id?: string;
  user_name: string;
  email: string;
  role: 'super_admin' | 'corporate_admin' | 'program_admin' | 'program_user' | 'driver';
  primary_program_id?: string;
  authorized_programs?: string[];
  avatar_url?: string;
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

      console.log('🔍 Making request to /api/auth/user with token:', currentSession.access_token.substring(0, 20) + '...');
      
      const response = await fetch('http://localhost:8081/api/auth/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ User data received:', data);
        return data.user;
      } else {
        const errorText = await response.text();
        console.log('❌ API error:', response.status, errorText);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      return null;
    }
  };

  const checkAuth = async () => {
    try {
      console.log('🔍 Starting auth check...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('🔍 Supabase session found:', session.user.email);
        console.log('🔍 Calling fetchUserData...');
        const userData = await fetchUserData(session.user, session);
        if (userData) {
          setUser(userData);
          console.log('✅ User authenticated:', userData.email);
        } else {
          console.log('❌ Failed to fetch user data');
          setUser(null);
        }
      } else {
        console.log('❌ No Supabase session');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setUser(null);
    } finally {
      console.log('🔍 Setting isLoading to false');
      setIsLoading(false);
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
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔍 SIGNED_IN event - calling fetchUserData...');
        const userData = await fetchUserData(session.user, session);
        if (userData) {
          console.log('✅ User data received in onAuthStateChange:', userData);
          setUser(userData);
        } else {
          console.log('❌ Failed to fetch user data in onAuthStateChange');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🔍 SIGNED_OUT event');
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
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}