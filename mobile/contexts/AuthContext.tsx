import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../services/api';

interface User {
  id: string;
  email: string;
  role: string;
  primaryOrganizationId: string;
  userName?: string;
  isDriver?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionTimeout: number;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  emergencyLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Driver session timeout: 12 hours (43200000 ms)
const DRIVER_SESSION_TIMEOUT = 12 * 60 * 60 * 1000;
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(DRIVER_SESSION_TIMEOUT);

  useEffect(() => {
    checkAuthStatus();
    
    // Set up periodic session validation
    const interval = setInterval(() => {
      if (user) {
        validateSession();
      }
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      const sessionData = await SecureStore.getItemAsync('session_data');
      if (sessionData) {
        const { token, timestamp, user: storedUser } = JSON.parse(sessionData);
        
        // Check if session has expired
        const now = Date.now();
        if (now - timestamp > DRIVER_SESSION_TIMEOUT) {
          await emergencyLogout();
          return;
        }

        // Validate session with server
        const response = await apiClient.getCurrentUser();
        if (response.user && response.user.role === 'driver') {
          setUser({ ...response.user, isDriver: true });
          setSessionTimeout(DRIVER_SESSION_TIMEOUT - (now - timestamp));
        } else {
          await emergencyLogout();
        }
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      await emergencyLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const validateSession = async () => {
    try {
      const sessionData = await SecureStore.getItemAsync('session_data');
      if (sessionData) {
        const { timestamp } = JSON.parse(sessionData);
        const now = Date.now();
        
        if (now - timestamp > DRIVER_SESSION_TIMEOUT) {
          await emergencyLogout();
          return;
        }

        // Update remaining timeout
        setSessionTimeout(DRIVER_SESSION_TIMEOUT - (now - timestamp));
      }
    } catch (error) {
      console.log('Session validation failed:', error);
      await emergencyLogout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      
      // Only allow drivers to use mobile app
      if (response.user.role !== 'driver') {
        throw new Error('Only drivers can access the mobile application. Please use the web interface for other roles.');
      }

      // Store minimal session data - the session cookie is handled by the API client
      const sessionData = {
        timestamp: Date.now(),
        user: response.user
      };

      await SecureStore.setItemAsync('session_data', JSON.stringify(sessionData));
      setUser({ 
        id: response.user.userId,
        email: response.user.email || email,
        role: response.user.role,
        primaryOrganizationId: response.user.primaryOrganizationId || 'monarch_competency',
        userName: response.user.userName,
        isDriver: true 
      });
      setSessionTimeout(DRIVER_SESSION_TIMEOUT);
    } catch (error) {
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.user && response.user.role === 'driver') {
        const sessionData = {
          token: 'refreshed_session',
          timestamp: Date.now(),
          user: response.user
        };
        
        await SecureStore.setItemAsync('session_data', JSON.stringify(sessionData));
        setUser({ ...response.user, isDriver: true });
        setSessionTimeout(DRIVER_SESSION_TIMEOUT);
      } else {
        await emergencyLogout();
      }
    } catch (error) {
      console.log('Session refresh failed:', error);
      await emergencyLogout();
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.log('Logout API call failed:', error);
    } finally {
      await emergencyLogout();
    }
  };

  const emergencyLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('session_data');
    } catch (error) {
      console.log('Error clearing session data:', error);
    }
    setUser(null);
    setSessionTimeout(0);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user,
      sessionTimeout,
      login, 
      logout, 
      refreshSession,
      emergencyLogout
    }}>
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