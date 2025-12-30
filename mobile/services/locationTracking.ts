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
  private isAvailable: boolean = true; // Track driver availability status

  /**
   * Initialize location tracking for a driver
   * REQUIRES location permission - will block if denied
   * @param userId - The user_id (not driver_id) - will be converted to driver_id
   */
  async initialize(userId: string): Promise<boolean> {
    try {
      console.log('📍 LocationTrackingService.initialize called for userId:', userId);
      console.log('📍 Platform:', Platform.OS);
      
      // First, get the driver ID from the user ID
      const driverId = await this.getDriverIdFromUserId(userId);
      if (!driverId) {
        console.error('❌ No driver record found for user:', userId);
        return false;
      }
      
      this.driverId = driverId;
      console.log('✅ Driver ID found:', driverId);

      // Check current permission status first
      let currentStatus;
      try {
        const permissionResult = await Location.getForegroundPermissionsAsync();
        currentStatus = permissionResult.status;
        console.log('📍 Current location permission status:', currentStatus);
      } catch (permError) {
        console.error('❌ Error checking location permissions:', permError);
        currentStatus = 'undetermined';
      }
      
      // Request location permissions (will show prompt if not already granted)
      console.log('📍 Requesting location permissions...');
      let foregroundStatus;
      try {
        const requestResult = await Location.requestForegroundPermissionsAsync();
        foregroundStatus = requestResult.status;
        console.log('📍 Location permission status after request:', foregroundStatus);
      } catch (requestError) {
        console.error('❌ Error requesting location permissions:', requestError);
        foregroundStatus = 'denied';
      }
      
      if (foregroundStatus !== 'granted') {
        const message = Platform.OS === 'web' 
          ? 'HALCYON DRIVE requires location access to track your position. Please allow location access in your browser settings and refresh the page.'
          : 'HALCYON DRIVE requires location access to track your position. Please enable location permissions in your device settings.';
        
        // On web, use console.warn instead of Alert (Alert might not work on web)
        if (Platform.OS === 'web') {
          console.warn('⚠️ Location permission denied:', message);
          console.warn('⚠️ Please allow location access in your browser settings:');
          console.warn('   1. Tap the lock icon in the address bar');
          console.warn('   2. Select "Location" and choose "Allow"');
          console.warn('   3. Refresh the page');
        } else {
          Alert.alert(
            'Location Permission Required',
            message,
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
        }
        return false;
      }

      // Request background location permission (for iOS only, not web)
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
      } else if (Platform.OS === 'web') {
        console.log('📍 Web platform detected - location tracking will work while browser tab is active');
      }

      // Fetch driver profile to get availability status
      try {
        const profile = await apiClient.getDriverProfile();
        const isAvailable = profile?.is_available ?? false; // Default to false - driver must explicitly enable
        this.isAvailable = isAvailable;
        console.log(`📍 Driver availability status loaded: ${isAvailable}`);
      } catch (error) {
        console.warn('⚠️ Could not fetch driver profile for availability status:', error);
        // Default to false - driver must explicitly enable
        this.isAvailable = false;
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
      if (this.isTracking) {
        console.log('📍 Location tracking is already active');
      }
      if (!this.driverId) {
        console.log('📍 Driver ID is not set - cannot start tracking');
      }
      return;
    }

    console.log('📍 Starting location tracking...');
    console.log('📍 Platform:', Platform.OS);
    console.log('📍 Driver ID:', this.driverId);

    // Start watching position (fires when device moves)
    try {
      this.locationWatchId = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Check every 5 seconds
          distanceInterval: 5, // Update every 5 meters
          mayShowUserSettingsDialog: true,
        },
        async (location) => {
          console.log('📍 Location watch triggered:', {
            lat: location.coords.latitude.toFixed(6),
            lng: location.coords.longitude.toFixed(6),
            accuracy: location.coords.accuracy?.toFixed(0) + 'm',
          });
          await this.handleLocationUpdate(location);
        }
      );
      console.log('✅ Location watch started');
    } catch (error) {
      console.error('❌ Failed to start location watch:', error);
      // Continue with periodic updates even if watch fails
    }

    // Also set up a periodic timer to force updates even when stationary
    // This ensures location stays fresh on the map even when driver is parked
    this.updateInterval = setInterval(async () => {
      try {
        // Get current location even if device hasn't moved
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        console.log('📍 Periodic location update:', {
          lat: currentLocation.coords.latitude.toFixed(6),
          lng: currentLocation.coords.longitude.toFixed(6),
          accuracy: currentLocation.coords.accuracy?.toFixed(0) + 'm',
        });
        
        await this.handleLocationUpdate(currentLocation);
      } catch (error) {
        console.warn('⚠️ Failed to get periodic location update:', error);
        // Don't throw - continue tracking
      }
    }, this.minUpdateInterval); // Every 10 seconds

    this.isTracking = true;
    console.log('✅ Location tracking started (with periodic updates every 10s)');
    console.log('📍 Platform:', Platform.OS);
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
   * 
   * Note: Uses current time (not location timestamp) to handle cached GPS locations
   */
  private shouldSendUpdate(location: LocationUpdate): boolean {
    if (!this.lastSentLocation) return true;

    // Use current time instead of location timestamp to handle cached GPS data
    // Location timestamp might be stale if GPS returns cached position
    const now = Date.now();
    const timeSinceLastUpdate = now - new Date(this.lastSentLocation.timestamp).getTime();
    
    // Always send if enough time has passed (keeps location fresh on map)
    if (timeSinceLastUpdate >= this.minUpdateInterval) {
      console.log(`📍 Sending location update (${Math.round(timeSinceLastUpdate / 1000)}s since last update)`);
      return true;
    }

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      this.lastSentLocation.latitude,
      this.lastSentLocation.longitude,
      location.latitude,
      location.longitude
    );

    // Send if moved significant distance
    if (distance >= this.minDistanceChange) {
      console.log(`📍 Sending location update (moved ${distance.toFixed(1)}m)`);
      return true;
    }

    // Skip update - not enough time passed and not enough movement
    return false;
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
   * Update availability status
   */
  setAvailability(isAvailable: boolean) {
    this.isAvailable = isAvailable;
    console.log(`📍 Location tracking availability set to: ${isAvailable}`);
    
    // If availability is turned off and we're tracking, we should stop sending updates
    // But keep tracking internally in case they have an active trip (which requires location)
    if (!isAvailable && !this.activeTripId) {
      console.log('📍 Location sharing disabled - updates will not be sent to backend');
    }
  }

  /**
   * Get current availability status
   */
  getAvailability(): boolean {
    return this.isAvailable;
  }

  /**
   * Send location update to backend
   */
  private async sendLocationUpdate(location: LocationUpdate) {
    if (!this.driverId) {
      console.warn('⚠️ Cannot send location update - driver ID not set');
      return;
    }

    // Check if driver is available OR has an active trip (location sharing mandatory during trips)
    const shouldShareLocation = this.isAvailable || this.activeTripId !== null;
    
    if (!shouldShareLocation) {
      console.log('📍 Skipping location update - driver not available and no active trip');
      return;
    }

    try {
      console.log('📍 Sending location update to backend...', {
        driverId: this.driverId,
        lat: location.latitude.toFixed(6),
        lng: location.longitude.toFixed(6),
        accuracy: location.accuracy.toFixed(0) + 'm',
        platform: Platform.OS,
      });
      
      await apiClient.updateDriverLocation(this.driverId, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed,
        tripId: this.activeTripId || undefined, // Include trip_id if active trip exists
      });

      console.log('✅ Location update sent successfully:', {
        lat: location.latitude.toFixed(6),
        lng: location.longitude.toFixed(6),
        accuracy: location.accuracy.toFixed(0) + 'm',
        tripId: this.activeTripId || 'none',
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('❌ Failed to send location update:', error);
      console.error('❌ Error details:', {
        driverId: this.driverId,
        platform: Platform.OS,
        error: error instanceof Error ? error.message : String(error),
      });
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

