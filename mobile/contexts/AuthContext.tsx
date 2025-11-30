import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { apiClient } from '../services/api';

// Conditionally import SecureStore only on native to prevent web bundler issues
let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    console.warn('SecureStore not available:', e);
  }
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  program_id?: string;
  corporate_client_id?: string;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      let token = null;
      if (Platform.OS === 'web') {
        // Use localStorage for web
        token = localStorage.getItem('auth_token');
      } else {
        token = SecureStore ? await SecureStore.getItemAsync('auth_token') : null;
      }
      
      if (token) {
        const response = await apiClient.getCurrentUser();
        console.log('Auth check response:', response);
        
        // Map the response to our user interface
        const userData = {
          id: response.user.user_id,
          email: response.user.email,
          name: response.user.user_name,
          role: response.user.role,
          program_id: response.user.primary_program_id,
          corporate_client_id: response.user.corporate_client_id,
          avatar_url: response.user.avatar_url
        };
        
        setUser(userData);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      if (Platform.OS === 'web') {
        localStorage.removeItem('auth_token');
      } else {
        await SecureStore.deleteItemAsync('auth_token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔍 AuthContext: Starting login for:', email);
      const response = await apiClient.login(email, password);
      console.log('✅ AuthContext: Login response received:', response);
      
      // Map the response to our user interface
      const userData = {
        id: response.user.user_id,
        email: response.user.email,
        name: response.user.user_name,
        role: response.user.role,
        program_id: response.user.primary_program_id,
        corporate_client_id: response.user.corporate_client_id,
        avatar_url: response.user.avatar_url
      };
      
      console.log('🔍 AuthContext: Mapped user data:', userData);
      setUser(userData);
      console.log('✅ AuthContext: User set successfully');
      
      // Token is already stored by the API client
    } catch (error) {
      console.log('❌ AuthContext: Login failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  const logout = async () => {
    try {
      console.log('🔍 [AuthContext] Starting logout...');
      await apiClient.logout();
      console.log('✅ [AuthContext] API logout successful');
      setUser(null);
      console.log('✅ [AuthContext] User state cleared');
      
      // Clear token based on platform
      if (Platform.OS === 'web') {
        localStorage.removeItem('auth_token');
        console.log('✅ [AuthContext] Token removed from localStorage');
      } else {
        if (SecureStore) {
          await SecureStore.deleteItemAsync('auth_token');
          console.log('✅ [AuthContext] Token removed from SecureStore');
        }
      }
      console.log('✅ [AuthContext] Logout completed successfully');
    } catch (error) {
      console.error('❌ [AuthContext] Logout failed:', error);
      throw error; // Re-throw so the caller can handle it
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

