/**
 * Location Tracking Service for Drivers
 * 
 * Continuously tracks driver location and sends updates to backend
 * Required for all drivers - blocks app usage if permission denied
 */

import { Platform, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { apiClient } from './api';

interface LocationUpdate {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

class LocationTrackingService {
  private locationWatchId: Location.LocationSubscription | null = null;
  private isTracking = false;
  private driverId: string | null = null;
  private activeTripId: string | null = null; // Track active trip for mileage calculation
  private updateInterval: NodeJS.Timeout | null = null;
  private lastSentLocation: LocationUpdate | null = null;
  private minUpdateInterval = 10000; // Send update every 10 seconds minimum
  private minDistanceChange = 10; // Send update if moved 10 meters

  /**
   * Initialize location tracking for a driver
   * REQUIRES location permission - will block if denied
   * @param userId - The user_id (not driver_id) - will be converted to driver_id
   */
  async initialize(userId: string): Promise<boolean> {
    try {
      console.log('📍 LocationTrackingService.initialize called for userId:', userId);
      
      // First, get the driver ID from the user ID
      const driverId = await this.getDriverIdFromUserId(userId);
      if (!driverId) {
        console.error('❌ No driver record found for user:', userId);
        return false;
      }
      
      this.driverId = driverId;
      console.log('✅ Driver ID found:', driverId);

      // Check current permission status first
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      console.log('📍 Current location permission status:', currentStatus);
      
      // Request location permissions (will show prompt if not already granted)
      console.log('📍 Requesting location permissions...');
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      console.log('📍 Location permission status after request:', foregroundStatus);
      
      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'HALCYON DRIVE requires location access to track your position. Please enable location permissions in your device settings.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {} },
            { 
              text: 'Open Settings', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return false;
      }

      // Request background location permission (for iOS)
      // Note: Expo Go has limitations with background location - may fail gracefully
      if (Platform.OS === 'ios') {
        try {
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus !== 'granted') {
            console.warn('⚠️ Background location permission not granted - tracking will stop when app is in background');
          } else {
            console.log('✅ Background location permission granted');
          }
        } catch (backgroundError) {
          // Expo Go may not support background location - that's okay, we'll use foreground only
          console.warn('⚠️ Could not request background location permission (Expo Go limitation):', backgroundError);
          console.log('📍 Location tracking will work in foreground only');
        }
      }

      console.log('✅ Location tracking initialized for driver:', this.driverId);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize location tracking:', error);
      // Don't fail completely - allow app to work without location tracking
      // User can manually enable it later
      return false;
    }
  }

  /**
   * Start continuous location tracking
   */
  startTracking() {
    if (this.isTracking || !this.driverId) {
      console.warn('⚠️ Location tracking already started or driver ID not set');
      return;
    }

    console.log('📍 Starting location tracking...');

    this.locationWatchId = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Check every 5 seconds
        distanceInterval: 5, // Update every 5 meters
        mayShowUserSettingsDialog: true,
      },
      async (location) => {
        await this.handleLocationUpdate(location);
      }
    );

    this.isTracking = true;
    console.log('✅ Location tracking started');
  }

  /**
   * Stop location tracking
   */
  stopTracking() {
    if (this.locationWatchId) {
      this.locationWatchId.remove();
      this.locationWatchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isTracking = false;
    this.lastSentLocation = null;
    console.log('🛑 Location tracking stopped');
  }

  /**
   * Handle location update from watchPositionAsync
   */
  private async handleLocationUpdate(location: Location.LocationObject) {
    if (!this.driverId) return;

    const locationUpdate: LocationUpdate = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy || 0,
      heading: location.coords.heading || undefined,
      speed: location.coords.speed || undefined,
      timestamp: new Date().toISOString(),
    };

    // Check if we should send this update
    if (this.shouldSendUpdate(locationUpdate)) {
      await this.sendLocationUpdate(locationUpdate);
      this.lastSentLocation = locationUpdate;
    }
  }

  /**
   * Determine if we should send this location update
   * Sends if:
   * - First update
   * - Moved more than minDistanceChange meters
   * - More than minUpdateInterval milliseconds since last update
   */
  private shouldSendUpdate(location: LocationUpdate): boolean {
    if (!this.lastSentLocation) return true;

    const timeSinceLastUpdate = new Date(location.timestamp).getTime() - 
      new Date(this.lastSentLocation.timestamp).getTime();
    
    if (timeSinceLastUpdate >= this.minUpdateInterval) return true;

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      this.lastSentLocation.latitude,
      this.lastSentLocation.longitude,
      location.latitude,
      location.longitude
    );

    return distance >= this.minDistanceChange;
  }

  /**
   * Calculate distance between two coordinates (in meters)
   * Using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Set active trip ID for mileage tracking
   */
  setActiveTrip(tripId: string | null) {
    this.activeTripId = tripId;
    if (tripId) {
      console.log('🔗 Location tracking linked to trip:', tripId);
    } else {
      console.log('🔗 Location tracking unlinked from trip');
    }
  }

  /**
   * Send location update to backend
   */
  private async sendLocationUpdate(location: LocationUpdate) {
    if (!this.driverId) return;

    try {
      await apiClient.updateDriverLocation(this.driverId, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed,
        tripId: this.activeTripId || undefined, // Include trip_id if active trip exists
      });

      console.log('📍 Location update sent:', {
        lat: location.latitude.toFixed(6),
        lng: location.longitude.toFixed(6),
        accuracy: location.accuracy.toFixed(0) + 'm',
        tripId: this.activeTripId || 'none',
      });
    } catch (error) {
      console.error('❌ Failed to send location update:', error);
      // Don't throw - continue tracking even if one update fails
    }
  }

  /**
   * Get current tracking status
   */
  getStatus(): { isTracking: boolean; driverId: string | null } {
    return {
      isTracking: this.isTracking,
      driverId: this.driverId,
    };
  }

  /**
   * Get driver ID from user ID
   * Uses the driver profile endpoint which returns the driver ID
   * The endpoint will auto-create a driver record if one doesn't exist
   */
  private async getDriverIdFromUserId(userId: string): Promise<string | null> {
    try {
      // Get driver profile which includes the driver ID
      // This endpoint will automatically create a driver record if one doesn't exist
      const profile = await apiClient.getDriverProfile();
      if (profile && profile.id) {
        console.log('✅ Found driver ID:', profile.id, 'for user:', userId);
        return profile.id;
      }
      
      console.error('❌ Driver profile did not include driver ID');
      return null;
    } catch (error: any) {
      // If the error is 404, it means the driver record couldn't be created
      // This might happen if user doesn't have primary_program_id
      if (error?.status === 404 || error?.message?.includes('not found')) {
        console.error('❌ Driver record not found and could not be created. User may need primary_program_id.');
      } else {
        console.error('❌ Error getting driver ID from profile:', error);
      }
      return null;
    }
  }

  /**
   * Cleanup - call when driver logs out
   */
  cleanup() {
    this.stopTracking();
    this.driverId = null;
  }
}

export const locationTrackingService = new LocationTrackingService();

