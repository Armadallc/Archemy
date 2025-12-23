import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  RefreshControl,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { apiClient } from '../../services/api';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { locationTrackingService } from '../../services/locationTracking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navigationPreferences } from '../../services/navigationPreferences';
import { openNavigation } from '../../utils/navigation';

interface Trip {
  id: string;
  program_id: string;
  client_id: string;
  client_name: string;
  client_phone?: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_pickup_time: string;
  scheduled_return_time?: string;
  actual_pickup_time?: string;
  actual_dropoff_time?: string;
  actual_return_time?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'confirmed' | 'no_show';
  trip_type: string;
  passenger_count: number;
  notes?: string;
  special_requirements?: string;
  is_group_trip?: boolean;
  client_group_id?: string;
  client_group_name?: string;
  // Telematics Phase 1 fields
  appointment_time?: string | null;
  trip_purpose?: string | null;
  trip_code?: string | null;
  trip_modifier?: string | null;
  programs?: {
    name: string;
    corporate_clients?: {
      name: string;
    };
  };
  clients?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  pickup_locations?: {
    name: string;
    address: string;
  };
  dropoff_locations?: {
    name: string;
    address: string;
  };
}

export default function TripDetailsScreen() {
  const { tripId } = useLocalSearchParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  
  // Feature flag for mobile check-in
  const { isEnabled: mobileCheckInEnabled } = useFeatureFlag('mobile_check_in_enabled');

  const [refreshing, setRefreshing] = useState(false);

  const { data: trips = [], refetch: refetchTrips } = useQuery({
    queryKey: ['driver-trips'],
    queryFn: () => apiClient.getDriverTrips(),
    enabled: !!user,
  });

  const trip = trips.find((t: Trip) => t.id === tripId);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchTrips();
    setRefreshing(false);
  };

  const updateTripMutation = useMutation({
    mutationFn: ({ tripId, status }: { tripId: string; status: string }) =>
      apiClient.updateTripStatus(tripId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-trips'] });
      // Show success feedback
      if (Platform.OS === 'web') {
        // For web/PWA, use a simple alert or notification
        console.log('Trip status updated successfully');
      }
    },
    onError: (error) => {
      console.error('Failed to update trip status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update trip status';
      Alert.alert('Error', errorMessage);
    },
  });

  const handleStatusUpdate = (newStatus: string) => {
    // Link/unlink location tracking based on trip status
    if (newStatus === 'in_progress') {
      // Link location tracking to this trip when trip starts
      locationTrackingService.setActiveTrip(tripId as string);
    } else if (newStatus === 'completed' || newStatus === 'cancelled') {
      // Unlink location tracking when trip ends
      locationTrackingService.setActiveTrip(null);
    }
    
    // For web/PWA, use window.confirm as fallback if Alert.alert doesn't work
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm(
        `Are you sure you want to mark this trip as ${newStatus.replace('_', ' ')}?`
      );
      if (confirmed) {
        updateTripMutation.mutate({ tripId: tripId as string, status: newStatus });
      }
    } else {
      // For native, use Alert.alert
      Alert.alert(
        'Update Trip Status',
        `Are you sure you want to mark this trip as ${newStatus.replace('_', ' ')}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              updateTripMutation.mutate({ tripId: tripId as string, status: newStatus });
            },
          },
        ]
      );
    }
  };

  const handleCallClient = () => {
    const phoneNumber = trip?.clients?.phone || trip?.client_phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('No Phone Number', 'Phone number not available for this client.');
    }
  };

  const getCurrentLocationForNavigation = async (): Promise<string | null> => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return null;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Return coordinates as "lat,lng" for maps URLs
      return `${location.coords.latitude},${location.coords.longitude}`;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  };

  const handleNavigateToPickup = async () => {
    const address = getPickupLocation(trip);
    if (!address) {
      Alert.alert('Error', 'Pickup address not available.');
      return;
    }
    
    // Try to get current location for source
    const currentLocation = await getCurrentLocationForNavigation();
    
    // Get preferred navigation app and open
    const preferredApp = await navigationPreferences.getPreferredApp();
    await openNavigation(preferredApp, address, currentLocation);
  };

  const handleNavigateToDropoff = async () => {
    const address = getDropoffLocation(trip);
    if (!address) {
      Alert.alert('Error', 'Dropoff address not available.');
      return;
    }
    
    // Try to get current location for source
    const currentLocation = await getCurrentLocationForNavigation();
    
    // Get preferred navigation app and open
    const preferredApp = await navigationPreferences.getPreferredApp();
    await openNavigation(preferredApp, address, currentLocation);
  };

  const handleNavigateRoundTrip = async () => {
    const pickupAddress = getPickupLocation(trip);
    const dropoffAddress = getDropoffLocation(trip);

    if (pickupAddress && dropoffAddress) {
      // For round trip, navigate from pickup to dropoff
      const preferredApp = await navigationPreferences.getPreferredApp();
      await openNavigation(preferredApp, dropoffAddress, pickupAddress);
    } else {
      Alert.alert('Error', 'Addresses not available for navigation.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return theme.colors.tripStatus.scheduled;
      case 'confirmed': return theme.colors.tripStatus.confirmed;
      case 'in_progress': return theme.colors.tripStatus.inProgress;
      case 'completed': return theme.colors.tripStatus.completed;
      case 'cancelled': return theme.colors.tripStatus.cancelled;
      case 'no_show': return theme.colors.driverColors.color5; // Orange for no-show
      default: return theme.colors.mutedForeground;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDisplayName = (trip: Trip) => {
    // For group trips, use the client group name
    if (trip.is_group_trip && trip.client_group_name) {
      return trip.client_group_name;
    }
    // For individual trips, use client name
    if (trip.clients?.first_name && trip.clients?.last_name) {
      return `${trip.clients.first_name} ${trip.clients.last_name}`;
    }
    return trip.client_name || 'Unknown Client';
  };

  const getDisplayPhone = (trip: Trip) => {
    return trip.clients?.phone || trip.client_phone || 'No phone available';
  };

  const getPickupLocation = (trip: Trip | undefined): string | null => {
    if (!trip) return null;
    // Prefer location name with address, fallback to address field
    if (trip.pickup_locations?.address) {
      return trip.pickup_locations.address;
    }
    if (trip.pickup_locations?.name) {
      return trip.pickup_locations.name;
    }
    return trip.pickup_address || null;
  };

  const getDropoffLocation = (trip: Trip | undefined): string | null => {
    if (!trip) return null;
    // Prefer location name with address, fallback to address field
    if (trip.dropoff_locations?.address) {
      return trip.dropoff_locations.address;
    }
    if (trip.dropoff_locations?.name) {
      return trip.dropoff_locations.name;
    }
    return trip.dropoff_address || null;
  };

  // Create styles with theme colors
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.card,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      ...theme.typography.h3,
      color: theme.colors.foreground,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },
    statusText: {
      ...theme.typography.caption,
      color: theme.colors.foreground,
      fontWeight: '600',
    },
    content: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.foreground,
      marginBottom: 12,
    },
    infoCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: theme.colors.foreground,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    infoContent: {
      flex: 1,
      marginLeft: 12,
    },
    infoLabel: {
      ...theme.typography.bodySmall,
      color: theme.colors.mutedForeground,
      marginBottom: 4,
    },
    infoValue: {
      ...theme.typography.body,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    infoSubtext: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    callButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    callButtonText: {
      ...theme.typography.caption,
      color: theme.colors.primary,
      fontWeight: '600',
      marginLeft: 4,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    locationContent: {
      flex: 1,
      marginLeft: 12,
    },
    locationLabel: {
      ...theme.typography.bodySmall,
      color: theme.colors.mutedForeground,
      marginBottom: 4,
    },
    locationText: {
      ...theme.typography.body,
      fontWeight: '600',
      color: theme.colors.foreground,
    },
    locationAddress: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
      marginTop: 2,
    },
    requirementsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.secondary,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.driverColors.color5, // Orange warning
    },
    requirementsText: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      fontWeight: '500',
      marginLeft: 12,
      flex: 1,
    },
    notesCard: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 12,
    },
    notesText: {
      ...theme.typography.body,
      color: theme.colors.foreground,
      lineHeight: 20,
    },
    actionsContainer: {
      marginTop: 20,
      marginBottom: 40,
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    noShowButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.driverColors.color5, // Orange
      alignItems: 'center',
      justifyContent: 'center',
    },
    noShowButtonText: {
      color: theme.colors.primaryForeground,
      ...theme.typography.caption,
      fontWeight: '700',
    },
    startButton: {
      backgroundColor: theme.colors.primary,
    },
    completeButton: {
      backgroundColor: theme.colors.tripStatus.completed,
    },
    navigationButton: {
      backgroundColor: theme.colors.driverColors.color1, // Purple
      marginBottom: 12,
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
    },
    navButtonText: {
      ...theme.typography.caption,
      fontWeight: '600',
      color: theme.colors.foreground,
      marginLeft: 4,
    },
    actionButtonText: {
      color: theme.colors.primaryForeground,
      ...theme.typography.body,
      fontWeight: '600',
      marginLeft: 8,
    },
    completedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
    },
    completedText: {
      ...theme.typography.body,
      color: theme.colors.tripStatus.completed,
      fontWeight: '600',
      marginLeft: 8,
    },
    backButtonText: {
      ...theme.typography.body,
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });

  if (!trip) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ ...theme.typography.body, color: theme.colors.foreground }}>Trip not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary || '#3B82F6'} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Details</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(trip.status) }]} />
          <Text style={styles.statusText}>{trip.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={theme.colors.mutedForeground} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{getDisplayName(trip)}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={theme.colors.mutedForeground} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{getDisplayPhone(trip)}</Text>
                <TouchableOpacity style={styles.callButton} onPress={handleCallClient}>
                  <Ionicons name="call" size={16} color={theme.colors.primary} />
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
            {trip.programs?.name && (
              <View style={styles.infoRow}>
                <Ionicons name="business" size={20} color={theme.colors.mutedForeground} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Program</Text>
                  <Text style={styles.infoValue}>{trip.programs.name}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Trip Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={theme.colors.mutedForeground} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Scheduled Time</Text>
                <Text style={styles.infoValue}>{formatTime(trip.scheduled_pickup_time)}</Text>
                <Text style={styles.infoSubtext}>{formatDate(trip.scheduled_pickup_time)}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="people" size={20} color={theme.colors.mutedForeground} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Passengers</Text>
                <Text style={styles.infoValue}>{trip.passenger_count}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="car" size={20} color={theme.colors.mutedForeground} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Trip Type</Text>
                <Text style={styles.infoValue}>{(trip.trip_type || (trip.scheduled_return_time ? 'round_trip' : 'one_way')).replace('_', ' ')}</Text>
              </View>
            </View>
            {/* Appointment Time - Telematics Phase 1 */}
            {trip.appointment_time && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={theme.colors.error || '#ef4444'} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Appointment Time</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.error || '#ef4444' }]}>
                    {formatTime(trip.appointment_time)}
                  </Text>
                  <Text style={styles.infoSubtext}>Must arrive at DO by this time</Text>
                </View>
              </View>
            )}
            {/* Trip Purpose - Telematics Phase 1 */}
            {trip.trip_purpose && (
              <View style={styles.infoRow}>
                <Ionicons name="pricetag" size={20} color={theme.colors.mutedForeground} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Trip Purpose</Text>
                  <Text style={styles.infoValue}>{trip.trip_purpose}</Text>
                </View>
              </View>
            )}
            {/* Trip Code & Modifier - Telematics Phase 1 */}
            {trip.trip_code && (
              <View style={styles.infoRow}>
                <Ionicons name="document-text" size={20} color={theme.colors.mutedForeground} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Billing Code</Text>
                  <Text style={styles.infoValue}>
                    {trip.trip_code}{trip.trip_modifier ? `-${trip.trip_modifier}` : ''}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locations</Text>
          <View style={styles.infoCard}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText}>
                  {trip.pickup_locations?.name || trip.pickup_address}
                </Text>
                {trip.pickup_locations?.address && (
                  <Text style={styles.locationAddress}>{trip.pickup_locations.address}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.navButton} onPress={handleNavigateToPickup}>
                <Ionicons name="navigate" size={20} color={theme.colors.primary} />
                <Text style={styles.navButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="flag" size={20} color={theme.colors.tripStatus.completed} />
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>Dropoff</Text>
                <Text style={styles.locationText}>
                  {trip.dropoff_locations?.name || trip.dropoff_address}
                </Text>
                {trip.dropoff_locations?.address && (
                  <Text style={styles.locationAddress}>{trip.dropoff_locations.address}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.navButton} onPress={handleNavigateToDropoff}>
                <Ionicons name="navigate" size={20} color={theme.colors.tripStatus.completed} />
                <Text style={styles.navButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Special Requirements */}
        {trip.special_requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Requirements</Text>
            <View style={styles.requirementsCard}>
              <Ionicons name="warning" size={20} color={theme.colors.driverColors.color5} />
              <Text style={styles.requirementsText}>{trip.special_requirements}</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        {trip.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{trip.notes}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons - Only show if mobile check-in is enabled */}
        {mobileCheckInEnabled && (
          <View style={styles.actionsContainer}>
            {/* Round Trip Navigation Button */}
            {(trip.trip_type || (trip.scheduled_return_time ? 'round_trip' : 'one_way')) === 'round_trip' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.navigationButton]}
                onPress={handleNavigateRoundTrip}
              >
                <Ionicons name="map" size={20} color={theme.colors.primaryForeground} />
                <Text style={styles.actionButtonText}>Navigate Round Trip</Text>
              </TouchableOpacity>
            )}
            
            {trip.status === 'scheduled' || trip.status === 'confirmed' ? (
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.startButton]}
                  onPress={() => handleStatusUpdate('in_progress')}
                  disabled={updateTripMutation.isPending}
                >
                  <Ionicons name="play" size={20} color={theme.colors.primaryForeground} />
                  <Text style={styles.actionButtonText}>Start Trip</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.noShowButton]}
                  onPress={() => handleStatusUpdate('no_show')}
                  disabled={updateTripMutation.isPending}
                >
                  <Text style={styles.noShowButtonText}>N/S</Text>
                </TouchableOpacity>
              </View>
            ) : trip.status === 'in_progress' ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleStatusUpdate('completed')}
                disabled={updateTripMutation.isPending}
              >
                <Ionicons name="checkmark" size={20} color={theme.colors.primaryForeground} />
                <Text style={styles.actionButtonText}>Complete Trip</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.completedContainer}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color={trip.status === 'no_show' 
                    ? theme.colors.driverColors.color5 
                    : theme.colors.tripStatus.completed} 
                />
                <Text style={styles.completedText}>Trip {trip.status === 'no_show' ? 'No Show' : trip.status}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}





