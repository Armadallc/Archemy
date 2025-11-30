import { Platform } from 'react-native';
import { logger } from './logger';
import { networkInspector } from './networkInspector';

// Conditionally import SecureStore only on native to prevent web bundler issues
let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (e) {
    console.warn('SecureStore not available:', e);
  }
}

// Use environment variable if available
// For physical devices, use your Mac's IP address (e.g., http://192.168.12.215:8081)
// For simulator, localhost works fine
// Backend API runs on port 8081, Expo dev server runs on port 8082
const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8081' 
  : (process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? 'http://localhost:8081' : 'http://192.168.12.215:8081'));

interface Trip {
  id: string;
  program_id: string;
  client_id: string;
  driver_id: string;
  pickup_location: string;
  dropoff_location: string;
  scheduled_pickup_time: string;
  scheduled_dropoff_time?: string;
  actual_pickup_time?: string;
  actual_dropoff_time?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  trip_type: string;
  passenger_count: number;
  notes?: string;
  priority?: 'normal' | 'urgent' | 'emergency';
  client_name?: string;
  client_phone?: string;
  // Additional fields from hierarchical system
  trip_category_id?: string;
  special_requirements?: string;
  recurring_trip_id?: string;
  client_group_id?: string;
}

interface TripStatusUpdate {
  status: Trip['status'];
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  private async getAuthHeaders() {
    let token = null;
    if (Platform.OS === 'web') {
      token = localStorage.getItem('auth_token');
    } else {
      token = SecureStore ? await SecureStore.getItemAsync('auth_token') : null;
    }
    
    logger.debug('Getting auth headers', 'ApiClient', { tokenPresent: !!token });
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      logger.error(`API request error for ${endpoint}`, 'ApiClient', { endpoint, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Authentication Methods
  async login(email: string, password: string) {
    console.log('🔍 API Client: Attempting login with:', { email, password: password.substring(0, 3) + '***' });
    try {
      const response = await this.request<{user: any, token: string, sessionId: string}>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      console.log('✅ API Client: Login successful, response:', response);
      
      // Store token for future requests
      if (response.token) {
        console.log('🔍 API Client: Storing token:', response.token.substring(0, 20) + '...');
        if (Platform.OS === 'web') {
          localStorage.setItem('auth_token', response.token);
          console.log('🔍 API Client: Token stored in localStorage');
        } else {
          await SecureStore.setItemAsync('auth_token', response.token);
          console.log('🔍 API Client: Token stored in SecureStore');
        }
      } else {
        console.log('❌ API Client: No token in response');
      }
      
      return response;
    } catch (error) {
      console.log('❌ API Client: Login failed:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
      
      if (Platform.OS === 'web') {
        localStorage.removeItem('auth_token');
      } else {
        await SecureStore.deleteItemAsync('auth_token');
      }
    } catch (error) {
      console.log('Logout API error:', error);
    }
  }

  async getCurrentUser() {
    return this.request<{user: any}>('/api/auth/user');
  }

  // Trip Management Methods - Updated for hierarchical system
  async getDriverTrips(): Promise<Trip[]> {
    // Use the mobile API endpoint that automatically finds the driver for the authenticated user
    return this.request<Trip[]>(`/api/mobile/trips/driver`);
  }

  async updateTripStatus(tripId: string, status: string, additionalData?: any) {
    // Remove timestamp - backend handles timestamps automatically based on status transitions
    const { timestamp, ...cleanAdditionalData } = additionalData || {};
    return this.request(`/api/trips/${tripId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...cleanAdditionalData
      }),
    });
  }

  async startTrip(tripId: string, location?: { latitude: number; longitude: number }) {
    // Backend handles timestamps automatically - only send notes if needed
    // location and timestamp are handled by backend based on status transition
    return this.updateTripStatus(tripId, 'in_progress', {
      notes: 'Trip started via mobile app'
    });
  }

  async completeTrip(tripId: string, location?: { latitude: number; longitude: number }, notes?: string) {
    // Backend handles timestamps automatically - only send notes if needed
    // location and timestamp are handled by backend based on status transition
    return this.updateTripStatus(tripId, 'completed', {
      notes: notes || 'Trip completed via mobile app'
    });
  }

  // Emergency Methods
  async sendEmergencyAlert(data: { location: any; tripId?: string }): Promise<any> {
    logger.info('Sending emergency alert', 'ApiClient', data);
    
    const response = await this.request('/api/emergency/panic', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response;
  }

  // Health Check
  async healthCheck() {
    return this.request('/api/health');
  }

  // Driver Profile Methods
  async getDriverProfile(): Promise<any> {
    return this.request('/api/mobile/driver/profile');
  }

  async updateDriverProfile(updates: { name?: string; email?: string; phone?: string }): Promise<any> {
    return this.request('/api/mobile/driver/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Avatar upload method - handles FormData
  async uploadAvatar(userId: string, imageUri: string, imageType: string = 'image/jpeg'): Promise<{ success: boolean; avatar_url: string; user: any }> {
    const url = `${this.baseURL}/api/users/${userId}/avatar`;
    const token = Platform.OS === 'web' 
      ? localStorage.getItem('auth_token')
      : (SecureStore ? await SecureStore.getItemAsync('auth_token') : null);

    // Create FormData
    const formData = new FormData();
    
    // For React Native, we need to append the file differently
    if (Platform.OS === 'web') {
      // For web, fetch the image as blob and append
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('avatar', blob, 'avatar.jpg');
    } else {
      // For React Native, use the URI directly
      formData.append('avatar', {
        uri: imageUri,
        type: imageType,
        name: 'avatar.jpg',
      } as any);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        // Don't set Content-Type - let the browser/React Native set it with boundary
      },
      body: formData,
    });

    if (response.status === 401) {
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Avatar upload failed: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
