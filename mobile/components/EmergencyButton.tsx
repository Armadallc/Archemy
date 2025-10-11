import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../services/logger';
import { apiClient } from '../services/api';

interface EmergencyButtonProps {
  driverName?: string;
  currentTripId?: string;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({ 
  driverName = 'Driver', 
  currentTripId 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const handlePressIn = () => {
    logger.info('Emergency button pressed - starting 3-second countdown', 'EmergencyButton');
    
    setIsPressed(true);
    setHoldProgress(0);
    setCountdown(3);
    
    // Start countdown
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          handleEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Start progress animation
    progressRef.current = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressRef.current!);
          return 100;
        }
        return prev + (100 / 30); // 3 seconds = 30 intervals of 100ms
      });
    }, 100);
  };

  const handlePressOut = () => {
    logger.info('Emergency button released - cancelling countdown', 'EmergencyButton');
    
    setIsPressed(false);
    setHoldProgress(0);
    setCountdown(3);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const handleEmergency = async () => {
    try {
      logger.info('Emergency activated - calling 911 and sending alerts', 'EmergencyButton');
      
      // 1. Call 911 immediately
      await Linking.openURL('tel:911');
      
      // 2. Get current location (simplified for now)
      const location = {
        latitude: 40.7128, // This would be replaced with actual GPS
        longitude: -74.0060,
        address: 'Current Location'
      };
      
      // 3. Send emergency alert to admins
      await sendEmergencyAlert(location);
      
      // 4. Show confirmation
      Alert.alert(
        'Emergency Alerted', 
        '911 has been called and admins have been notified',
        [{ text: 'OK', style: 'default' }]
      );
      
      logger.info('Emergency alert completed successfully', 'EmergencyButton');
      
    } catch (error) {
      logger.error('Error during emergency activation', 'EmergencyButton', { error: error.message });
      Alert.alert('Error', 'Failed to activate emergency. Please call 911 manually.');
    }
  };

  const sendEmergencyAlert = async (location: any) => {
    try {
      // Call the backend API to send SMS alerts
      logger.info('Emergency alert data prepared', 'EmergencyButton', {
        driverName,
        location,
        tripId: currentTripId,
        timestamp: new Date().toISOString()
      });
      
      const response = await apiClient.sendEmergencyAlert({ 
        location, 
        tripId: currentTripId 
      });
      
      logger.info('Emergency alert sent successfully', 'EmergencyButton', { response });
      
    } catch (error) {
      logger.error('Failed to send emergency alert', 'EmergencyButton', { error: error.message });
      throw error;
    }
  };

  return (
    <View style={styles.emergencyContainer}>
      <TouchableOpacity
        style={[
          styles.emergencyButton,
          isPressed && styles.emergencyButtonPressed
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Text style={styles.emergencyAsterisk}>*</Text>
        {isPressed && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {isPressed && (
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${holdProgress}%` }
            ]} 
          />
        </View>
      )}
      
      <Text style={styles.emergencyLabel}>Hold for Emergency</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emergencyContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  emergencyButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  emergencyButtonPressed: {
    backgroundColor: '#DC2626',
    transform: [{ scale: 0.95 }],
  },
  emergencyAsterisk: {
    fontSize: 144,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  countdownOverlay: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 2,
  },
  emergencyLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
});
