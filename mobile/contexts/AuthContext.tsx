import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { apiClient } from '../services/api';
import { locationTrackingService } from '../services/locationTracking';

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
  initializeLocationTracking: () => Promise<boolean>;
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
        
        // Initialize location tracking if user is a driver
        console.log('🔍 Checking user role for location tracking:', userData.role);
        if (userData.role === 'driver') {
          console.log('✅ User is a driver, initializing location tracking...');
          const initialized = await locationTrackingService.initialize(userData.id);
          if (initialized) {
            console.log('✅ Location tracking initialized, starting...');
            locationTrackingService.startTracking();
          } else {
            console.warn('⚠️ Location tracking initialization failed');
          }
        } else {
          console.log('ℹ️ User is not a driver (role:', userData.role, '), skipping location tracking');
        }
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
      
      // Initialize location tracking if user is a driver
      console.log('🔍 Checking user role for location tracking:', userData.role);
      if (userData.role === 'driver') {
        console.log('✅ User is a driver, initializing location tracking...');
        const initialized = await locationTrackingService.initialize(userData.id);
        if (initialized) {
          console.log('✅ Location tracking initialized, starting...');
          
          // Fetch driver profile to get availability status
          try {
            const profile = await apiClient.getDriverProfile();
            const isAvailable = profile?.is_available ?? false; // Default to false - driver must explicitly enable
            locationTrackingService.setAvailability(isAvailable);
            console.log(`📍 Driver availability status: ${isAvailable}`);
          } catch (error) {
            console.warn('⚠️ Could not fetch driver profile for availability status:', error);
            // Default to false - driver must explicitly enable
            locationTrackingService.setAvailability(false);
          }
          
          locationTrackingService.startTracking();
        } else {
          // If location permission denied, still allow login but warn user
          console.warn('⚠️ Location tracking not started - permission denied or driver ID not found');
        }
      } else {
        console.log('ℹ️ User is not a driver (role:', userData.role, '), skipping location tracking');
      }
    } catch (error) {
      console.log('❌ AuthContext: Login failed:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    await checkAuthStatus();
  };

  // Function to manually initialize location tracking (useful if driver record was just created)
  const initializeLocationTracking = async () => {
    if (!user || user.role !== 'driver') {
      console.log('ℹ️ User is not a driver, cannot initialize location tracking');
      return false;
    }

    console.log('🔄 Manually initializing location tracking for driver:', user.id);
    const initialized = await locationTrackingService.initialize(user.id);
    if (initialized) {
      console.log('✅ Location tracking initialized, starting...');
      locationTrackingService.startTracking();
      return true;
    } else {
      console.warn('⚠️ Location tracking initialization failed');
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🔍 [AuthContext] Starting logout...');
      
      // Stop location tracking before logout
      locationTrackingService.cleanup();
      
      // Clear user state first
      setUser(null);
      console.log('✅ [AuthContext] User state cleared');
      
      // Call API logout (which will also clear tokens)
      // Even if this fails, we've already cleared user state
      try {
        await apiClient.logout();
        console.log('✅ [AuthContext] API logout successful');
      } catch (apiError) {
        // Log but don't throw - tokens are cleared by apiClient.logout() anyway
        console.log('⚠️ [AuthContext] API logout call failed (tokens still cleared):', apiError);
      }
      
      // Double-check tokens are cleared (redundant but safe)
      if (Platform.OS === 'web') {
        localStorage.removeItem('auth_token');
        console.log('✅ [AuthContext] Token removed from localStorage (double-check)');
      } else {
        if (SecureStore) {
          try {
            await SecureStore.deleteItemAsync('auth_token');
            console.log('✅ [AuthContext] Token removed from SecureStore (double-check)');
          } catch (storeError) {
            console.error('❌ [AuthContext] Error removing token from SecureStore:', storeError);
          }
        }
      }
      
      console.log('✅ [AuthContext] Logout completed successfully');
    } catch (error) {
      console.error('❌ [AuthContext] Logout failed:', error);
      // Don't throw - ensure logout always succeeds even if there's an error
      // This prevents users from being stuck logged in
      setUser(null);
      if (Platform.OS === 'web') {
        localStorage.removeItem('auth_token');
      } else if (SecureStore) {
        try {
          await SecureStore.deleteItemAsync('auth_token');
        } catch (e) {
          // Ignore errors
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser, initializeLocationTracking }}>
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

