import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import CustomToggle from './CustomToggle';
import NeumorphicCard from './NeumorphicCard';
import NeumorphicView from './NeumorphicView';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { locationTrackingService } from '../services/locationTracking';
import { router } from 'expo-router';

interface AvailabilityPopupProps {
  visible: boolean;
  onClose: () => void;
  onBypass: () => void;
  driverProfileId?: string;
  initialAvailability?: boolean;
  message?: string;
  showBypass?: boolean;
  onAvailabilityEnabled?: () => void; // Callback when availability is enabled
}

export default function AvailabilityPopup({
  visible,
  onClose,
  onBypass,
  driverProfileId,
  initialAvailability = false,
  message,
  showBypass = true,
  onAvailabilityEnabled,
}: AvailabilityPopupProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [isAvailable, setIsAvailable] = useState(initialAvailability);

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (is_available: boolean) => {
      if (!driverProfileId) {
        throw new Error('Driver profile ID not available');
      }
      return apiClient.updateDriverAvailability(driverProfileId, is_available);
    },
    onSuccess: (_, is_available) => {
      // Update location tracking service
      locationTrackingService.setAvailability(is_available);
      // Refresh driver profile
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      
      if (is_available) {
        // Call callback if provided (e.g., to proceed with trip start)
        if (onAvailabilityEnabled) {
          onAvailabilityEnabled();
        }
        // Close popup - navigation handled by parent if needed
        onClose();
      }
    },
    onError: (error: any) => {
      console.error('Availability update error:', error);
      Alert.alert('Error', error?.message || 'Failed to update availability');
    },
  });

  const handleToggle = (value: boolean) => {
    setIsAvailable(value);
    if (value && driverProfileId) {
      // If toggling ON, immediately update
      updateAvailabilityMutation.mutate(value);
    }
  };

  const handleContinue = () => {
    if (isAvailable && driverProfileId) {
      updateAvailabilityMutation.mutate(true);
    } else {
      // If not available, just close
      onClose();
    }
  };

  // Note: CustomToggle handles all styling internally, no DOM manipulation needed

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      ...(Platform.OS === 'web' && {
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      } as any),
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
    },
    title: {
      ...theme.typography.h2,
      color: theme.colors.foreground,
      marginBottom: 8,
      fontWeight: '600',
      ...(Platform.OS === 'web' && {
        fontSize: 16,
      } as any),
    },
    message: {
      ...theme.typography.body,
      color: theme.colors.mutedForeground,
      marginBottom: 24,
      lineHeight: 20,
      ...(Platform.OS === 'web' && {
        fontSize: 16,
      } as any),
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    toggleLabel: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      fontWeight: '500',
      flex: 1,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    secondaryButton: {
      backgroundColor: theme.colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    buttonText: {
      ...theme.typography.body,
      fontWeight: '600',
      marginLeft: 8,
    },
    primaryButtonText: {
      color: theme.colors.primaryForeground,
    },
    secondaryButtonText: {
      color: theme.colors.foreground,
    },
  });

  const switchWrapperRef = useRef<View>(null);

  // Directly manipulate DOM to override inline styles on web
  useEffect(() => {
    if (Platform.OS === 'web' && switchWrapperRef.current) {
      const updateThumbColor = () => {
        const wrapper = switchWrapperRef.current;
        if (!wrapper) return;
        
        // Find the thumb element (the 20x20px circle)
        const thumbElement = (wrapper as any)._nativeNode?.querySelector?.('div[style*="background-color"]') ||
                             (wrapper as any)._nativeNode?.querySelector?.('div[style*="background"]') ||
                             (wrapper as any)._nativeNode?.querySelector?.('div[class*="r-alignSelf"]');
        
        if (thumbElement) {
          const targetColor = isAvailable ? '#ff8475' : 'rgba(255, 132, 117, 0.4)';
          thumbElement.style.backgroundColor = targetColor;
          thumbElement.style.background = targetColor;
          // Override any inline style that might have rgb(0, 150, 136)
          if (thumbElement.style.cssText) {
            thumbElement.style.cssText = thumbElement.style.cssText.replace(
              /background[^;]*rgb\(0,\s*150,\s*136\)[^;]*;?/gi,
              `background-color: ${targetColor}; background: ${targetColor};`
            );
          }
        }
      };

      // Update immediately and on state change
      updateThumbColor();
      const interval = setInterval(updateThumbColor, 100);
      
      return () => clearInterval(interval);
    }
  }, [isAvailable, visible]);

  const renderContent = () => (
    <NeumorphicCard
      style="embossed"
      intensity="medium"
      borderRadius={16}
      padding={24}
      containerStyle={styles.modalContent}
    >
      <Text style={styles.title}>Driver Status</Text>
      <Text style={styles.message}>
        {message || 
          'Enable location sharing to allow fleet managers to track your position. Location sharing is required when providing trips.'}
      </Text>
      
      <NeumorphicView
        style="debossed"
        intensity="subtle"
        borderRadius={12}
        contentStyle={styles.toggleContainer}
      >
        <Text style={styles.toggleLabel}>Available</Text>
        <CustomToggle
          value={isAvailable}
          onValueChange={handleToggle}
          disabled={updateAvailabilityMutation.isPending}
          trackColor={{ false: 'rgba(255, 255, 255, 1)', true: 'rgba(255, 255, 255, 1)' }}
          thumbColor={{ false: 'rgba(255, 132, 117, 0.4)', true: '#ff8475' }}
        />
        {updateAvailabilityMutation.isPending && (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: 8 }} />
        )}
      </NeumorphicView>

      <View style={styles.buttonContainer}>
        {showBypass && (
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={onBypass}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>View Trips</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleContinue}
          activeOpacity={0.7}
          disabled={updateAvailabilityMutation.isPending}
        >
          {updateAvailabilityMutation.isPending ? (
            <ActivityIndicator color={theme.colors.primaryForeground} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primaryForeground} />
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                Continue
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </NeumorphicCard>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={showBypass ? onBypass : onClose}
    >
      {Platform.OS === 'web' ? (
        <View style={styles.modalOverlay} collapsable={false}>
          {renderContent()}
        </View>
      ) : (
        <BlurView
          intensity={80}
          tint={theme.mode === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'transparent' }]} collapsable={false}>
            {renderContent()}
          </View>
        </BlurView>
      )}
    </Modal>
  );
}

