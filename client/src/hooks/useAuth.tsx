import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { useLocation } from 'wouter';

export interface User {
  userId: string;
  userName: string;
  email: string;
  role: 'super_admin' | 'monarch_owner' | 'organization_admin' | 'organization_user' | 'driver';
  primaryOrganizationId?: string;
  authorizedOrganizations?: string[];
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  demoLogin: (userType?: string) => Promise<{ success: boolean; error?: string }>;
  superAdminLogin: () => Promise<{ success: boolean; error?: string }>;
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

  const checkAuth = async () => {
    console.log('🔍 Checking auth status...');
    console.log('🍪 Current cookies:', document.cookie);
    
    try {
      const headers: any = {
        'Cache-Control': 'no-cache'
      };
      
      // Add Bearer token for development persistence
      const authToken = localStorage.getItem('auth_token');
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('🔑 Using stored auth token for persistent login');
      }

      const response = await fetch('/api/auth/user', {
        credentials: 'include',
        headers
      });

      console.log('🌐 Auth response status:', response.status);
      console.log('🌐 Auth response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        const userData = data.user || data;
        
        // Map snake_case to camelCase for consistent frontend usage
        const mappedUser = {
          ...userData,
          userId: userData.user_id,
          userName: userData.user_name,
          primaryOrganizationId: userData.primary_organization_id,
          authorizedOrganizations: userData.authorized_organizations,
          isActive: userData.is_active,
          avatarUrl: userData.avatar_url
        };
        
        setUser(mappedUser);
        console.log('✅ User authenticated:', mappedUser.email);
      } else {
        const errorData = await response.text();
        console.log('❌ Auth failed with response:', errorData);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    console.log('Login attempt:', { email, passwordLength: password.length });
    console.log('🔐 Attempting login for:', email);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user;
        
        // Map snake_case to camelCase for consistent frontend usage
        const mappedUser = {
          ...userData,
          userId: userData.user_id,
          userName: userData.user_name,
          primaryOrganizationId: userData.primary_organization_id,
          authorizedOrganizations: userData.authorized_organizations,
          isActive: userData.is_active,
          avatarUrl: userData.avatar_url
        };
        
        setUser(mappedUser);
        
        // Store auth token for API requests - use user email as token for development persistence
        const authToken = data.token || mappedUser.email;
        localStorage.setItem('auth_token', authToken);
        console.log('🔑 Auth token stored for API requests');
        
        console.log('✅ Login successful:', mappedUser.email);
        console.log('🏢 User organization:', mappedUser.primaryOrganizationId);
        
        // Navigate to dashboard for all users
        setLocation('/');
        
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('❌ Login failed:', errorData.message);
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('❌ Login network error:', error);
      return { success: false, error: 'Network error during login' };
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (userType?: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userType })
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user;
        
        // Map snake_case to camelCase for consistent frontend usage
        const mappedUser = {
          ...userData,
          userId: userData.user_id,
          userName: userData.user_name,
          primaryOrganizationId: userData.primary_organization_id,
          authorizedOrganizations: userData.authorized_organizations,
          isActive: userData.is_active,
          avatarUrl: userData.avatar_url
        };
        
        setUser(mappedUser);
        
        // Store auth token for session persistence
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        
        setLocation('/');
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Demo login error:', error);
      return { success: false, error: 'Failed to demo login' };
    } finally {
      setIsLoading(false);
    }
  };

  const superAdminLogin = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: 'superadmin@monarch.com', 
          password: '7bPHY^rXCNS%2#g' 
        })
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user;
        
        // Map snake_case to camelCase for consistent frontend usage
        const mappedUser = {
          ...userData,
          userId: userData.user_id,
          userName: userData.user_name,
          primaryOrganizationId: userData.primary_organization_id,
          authorizedOrganizations: userData.authorized_organizations,
          isActive: userData.is_active,
          avatarUrl: userData.avatar_url
        };
        
        setUser(mappedUser);
        
        // Store auth token for session persistence
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        
        setLocation('/');
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message };
      }
    } catch (error) {
      console.error('Super admin login error:', error);
      return { success: false, error: 'Failed to login as super admin' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      localStorage.removeItem('auth_token');
      console.log('✅ Logout successful');
      setLocation('/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
      setUser(null);
      setLocation('/login');
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    demoLogin,
    superAdminLogin,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}