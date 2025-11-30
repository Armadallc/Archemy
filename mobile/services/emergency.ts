import { Platform, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { notificationService } from './notifications';
import { webSocketService } from './websocket';
import { apiClient } from './api';

export interface EmergencyData {
  id: string;
  driverId: string;
  driverName: string;
  type: 'panic' | 'medical' | 'safety' | 'vehicle' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: string;
  status: 'active' | 'resolved' | 'cancelled';
  tripId?: string;
  clientId?: string;
  clientName?: string;
}

class EmergencyService {
  private isEmergencyActive = false;
  private emergencyId: string | null = null;
  private locationWatchId: Location.LocationSubscription | null = null;

  async initialize() {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Location permission not granted for emergency features');
        return false;
      }

      console.log('✅ Emergency service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize emergency service:', error);
      return false;
    }
  }

  async triggerPanicButton(driverId: string, driverName: string, tripId?: string, clientId?: string, clientName?: string) {
    try {
      if (this.isEmergencyActive) {
        Alert.alert('Emergency Already Active', 'An emergency is already in progress');
        return;
      }

      // Get current location
      const location = await this.getCurrentLocation();
      
      const emergencyData: EmergencyData = {
        id: `emergency_${Date.now()}`,
        driverId,
        driverName,
        type: 'panic',
        severity: 'critical',
        description: 'Driver activated panic button',
        location,
        timestamp: new Date().toISOString(),
        status: 'active',
        tripId,
        clientId,
        clientName,
      };

      this.isEmergencyActive = true;
      this.emergencyId = emergencyData.id;

      // Send emergency notification
      await notificationService.showEmergencyNotification(
        emergencyData.id,
        `PANIC BUTTON ACTIVATED by ${driverName}`
      );

      // Send via WebSocket
      webSocketService.send({
        type: 'emergency',
        data: emergencyData,
      });

      // Send to backend API
      await this.reportEmergency(emergencyData);

      // Start location tracking
      this.startLocationTracking();

      // Show confirmation
      Alert.alert(
        '🚨 EMERGENCY ACTIVATED',
        'Emergency services have been notified. Help is on the way.',
        [
          {
            text: 'Call 911',
            onPress: () => Linking.openURL('tel:911'),
            style: 'destructive',
          },
          {
            text: 'Cancel Emergency',
            onPress: () => this.cancelEmergency(),
            style: 'cancel',
          },
        ]
      );

      console.log('🚨 Panic button activated:', emergencyData);
    } catch (error) {
      console.error('❌ Failed to trigger panic button:', error);
      Alert.alert('Error', 'Failed to activate emergency. Please call 911 directly.');
    }
  }

  async reportIncident(
    driverId: string,
    driverName: string,
    type: EmergencyData['type'],
    severity: EmergencyData['severity'],
    description: string,
    tripId?: string,
    clientId?: string,
    clientName?: string
  ) {
    try {
      const location = await this.getCurrentLocation();
      
      const emergencyData: EmergencyData = {
        id: `incident_${Date.now()}`,
        driverId,
        driverName,
        type,
        severity,
        description,
        location,
        timestamp: new Date().toISOString(),
        status: 'active',
        tripId,
        clientId,
        clientName,
      };

      // Send via WebSocket
      webSocketService.send({
        type: 'emergency',
        data: emergencyData,
      });

      // Send to backend API
      await this.reportEmergency(emergencyData);

      // Show notification
      await notificationService.showEmergencyNotification(
        emergencyData.id,
        `Incident reported: ${type.toUpperCase()} - ${severity.toUpperCase()}`
      );

      Alert.alert(
        'Incident Reported',
        'Your incident report has been submitted to dispatch and management.',
        [{ text: 'OK' }]
      );

      console.log('📋 Incident reported:', emergencyData);
    } catch (error) {
      console.error('❌ Failed to report incident:', error);
      Alert.alert('Error', 'Failed to submit incident report. Please try again.');
    }
  }

  private async getCurrentLocation() {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode to get address
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address[0] ? `${address[0].street}, ${address[0].city}, ${address[0].region}` : 'Unknown location',
      };
    } catch (error) {
      console.error('❌ Failed to get location:', error);
      return undefined;
    }
  }

  private startLocationTracking() {
    if (this.locationWatchId) return;

    this.locationWatchId = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 10, // Update every 10 meters
      },
      (location) => {
        // Send location update to backend
        webSocketService.send({
          type: 'emergency',
          data: {
            emergencyId: this.emergencyId,
            type: 'location_update',
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: new Date().toISOString(),
            },
          },
        });
      }
    );
  }

  private stopLocationTracking() {
    if (this.locationWatchId) {
      this.locationWatchId.remove();
      this.locationWatchId = null;
    }
  }

  async cancelEmergency() {
    if (!this.isEmergencyActive || !this.emergencyId) return;

    try {
      this.isEmergencyActive = false;
      this.stopLocationTracking();

      // Send cancellation via WebSocket
      webSocketService.send({
        type: 'emergency',
        data: {
          emergencyId: this.emergencyId,
          type: 'cancelled',
          timestamp: new Date().toISOString(),
        },
      });

      // Send to backend API
      await this.cancelEmergencyReport(this.emergencyId);

      this.emergencyId = null;

      Alert.alert('Emergency Cancelled', 'Emergency has been cancelled successfully.');
      console.log('✅ Emergency cancelled');
    } catch (error) {
      console.error('❌ Failed to cancel emergency:', error);
    }
  }

  private async reportEmergency(emergencyData: EmergencyData) {
    try {
      // In a real app, this would call the backend API
      console.log('📤 Reporting emergency to backend:', emergencyData);
      // await apiClient.reportEmergency(emergencyData);
    } catch (error) {
      console.error('❌ Failed to report emergency to backend:', error);
    }
  }

  private async cancelEmergencyReport(emergencyId: string) {
    try {
      // In a real app, this would call the backend API
      console.log('📤 Cancelling emergency report:', emergencyId);
      // await apiClient.cancelEmergency(emergencyId);
    } catch (error) {
      console.error('❌ Failed to cancel emergency report:', error);
    }
  }

  isEmergencyInProgress() {
    return this.isEmergencyActive;
  }

  getCurrentEmergencyId() {
    return this.emergencyId;
  }
}

export const emergencyService = new EmergencyService();

