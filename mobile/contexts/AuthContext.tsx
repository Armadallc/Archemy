import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { apiClient } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  program_id?: string;
  corporate_client_id?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
        token = await SecureStore.getItemAsync('auth_token');
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
          corporate_client_id: response.user.corporate_client_id
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
        corporate_client_id: response.user.corporate_client_id
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

  const logout = async () => {
    try {
      await apiClient.logout();
      setUser(null);
      
      // Clear token based on platform
      if (Platform.OS === 'web') {
        localStorage.removeItem('auth_token');
      } else {
        await SecureStore.deleteItemAsync('auth_token');
      }
    } catch (error) {
      console.log('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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

