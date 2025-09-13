import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface Trip {
  id: string;
  organizationId: string;
  clientId: string;
  driverId: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledPickupTime: string;
  scheduledDropoffTime?: string;
  actualPickupTime?: string;
  actualDropoffTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  tripType: string;
  passengerCount: number;
  notes?: string;
  priority?: 'normal' | 'urgent' | 'emergency';
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

interface EmergencyContact {
  name: string;
  phone: string;
  type: 'dispatch' | 'supervisor' | 'emergency';
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
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
        credentials: 'include', // Include cookies for session management
      });

      // Handle authentication errors
      if (response.status === 401) {
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.log(`API request error for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication Methods
  async login(email: string, password: string) {
    const response = await this.request<{user: any, sessionId: string}>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    return response;
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.log('Logout API error:', error);
    }
  }

  async getCurrentUser() {
    return this.request<{user: any}>('/api/auth/user');
  }

  // Trip Management Methods
  async getDriverTrips(): Promise<Trip[]> {
    return this.request<Trip[]>(`/api/mobile/driver/trips`);
  }

  async getTripsByOrganization(organizationId: string): Promise<Trip[]> {
    return this.request<Trip[]>(`/api/trips/organization/${organizationId}`);
  }

  async updateTripStatus(tripId: string, status: string, additionalData?: any) {
    return this.request(`/api/mobile/trips/${tripId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        timestamp: new Date().toISOString(),
        ...additionalData
      }),
    });
  }

  async startTrip(tripId: string, location?: { latitude: number; longitude: number }) {
    const statusUpdate: TripStatusUpdate = {
      status: 'in_progress',
      timestamp: new Date().toISOString(),
      location,
      notes: 'Trip started via mobile app'
    };
    
    return this.updateTripStatus(tripId, statusUpdate);
  }

  async completeTrip(tripId: string, location?: { latitude: number; longitude: number }, notes?: string) {
    const statusUpdate: TripStatusUpdate = {
      status: 'completed',
      timestamp: new Date().toISOString(),
      location,
      notes: notes || 'Trip completed via mobile app'
    };
    
    return this.updateTripStatus(tripId, statusUpdate);
  }

  async cancelTrip(tripId: string, reason: string) {
    const statusUpdate: TripStatusUpdate = {
      status: 'cancelled',
      timestamp: new Date().toISOString(),
      notes: `Trip cancelled: ${reason}`
    };
    
    return this.updateTripStatus(tripId, statusUpdate);
  }

  // Emergency Communication Methods
  async sendEmergencyAlert(driverId: string, location?: { latitude: number; longitude: number }, message?: string) {
    return this.request('/api/emergency/alert', {
      method: 'POST',
      body: JSON.stringify({
        driverId,
        location,
        message: message || 'Emergency alert triggered from mobile app',
        timestamp: new Date().toISOString(),
        type: 'driver_emergency'
      }),
    });
  }

  async sendPanicAlert(driverId: string, tripId?: string, location?: { latitude: number; longitude: number }) {
    return this.request('/api/emergency/panic', {
      method: 'POST',
      body: JSON.stringify({
        driverId,
        tripId,
        location,
        timestamp: new Date().toISOString(),
        severity: 'critical'
      }),
    });
  }

  async getEmergencyContacts(organizationId: string): Promise<EmergencyContact[]> {
    return this.request<EmergencyContact[]>(`/api/emergency/contacts/${organizationId}`);
  }

  async reportIncident(incidentData: {
    driverId: string;
    tripId?: string;
    type: 'accident' | 'breakdown' | 'medical' | 'security' | 'other';
    description: string;
    location?: { latitude: number; longitude: number };
    severity: 'low' | 'medium' | 'high' | 'critical';
  }) {
    return this.request('/api/incidents/report', {
      method: 'POST',
      body: JSON.stringify({
        ...incidentData,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  // Driver Profile Methods
  async getDriverProfile(driverId: string) {
    return this.request(`/api/drivers/${driverId}`);
  }

  async updateDriverStatus(driverId: string, status: 'available' | 'busy' | 'offline' | 'break') {
    return this.request(`/api/drivers/${driverId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        status,
        timestamp: new Date().toISOString()
      }),
    });
  }

  async getDriverSchedule(driverId: string) {
    return this.request(`/api/drivers/${driverId}/schedule`);
  }

  async getDriverVehicles(driverId: string) {
    return this.request<any[]>(`/api/drivers/${driverId}/vehicles`);
  }

  async getDriverSchedules(driverId: string) {
    return this.request<any[]>(`/api/drivers/${driverId}/schedules`);
  }

  // Offline Support Methods
  async syncOfflineData(offlineData: any[]) {
    return this.request('/api/sync/offline', {
      method: 'POST',
      body: JSON.stringify({ 
        data: offlineData,
        timestamp: new Date().toISOString()
      }),
    });
  }

  // Health Check
  async healthCheck() {
    return this.request('/api/health');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);