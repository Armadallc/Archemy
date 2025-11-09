import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';

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
  const queryClient = useQueryClient();

  const { data: trips = [] } = useQuery({
    queryKey: ['driver-trips'],
    queryFn: () => apiClient.getDriverTrips(),
    enabled: !!user,
  });

  const trip = trips.find((t: Trip) => t.id === tripId);

  const updateTripMutation = useMutation({
    mutationFn: ({ tripId, status }: { tripId: string; status: string }) =>
      apiClient.updateTripStatus(tripId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-trips'] });
    },
  });

  const handleStatusUpdate = (newStatus: string) => {
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
  };

  const handleCallClient = () => {
    const phoneNumber = trip?.clients?.phone || trip?.client_phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('No Phone Number', 'Phone number not available for this client.');
    }
  };

  const handleNavigateToPickup = () => {
    const address = getPickupLocation(trip);
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      const mapsUrl = `https://maps.google.com/maps?daddr=${encodedAddress}`;
      Linking.openURL(mapsUrl).catch(() => {
        // Fallback to Apple Maps on iOS
        const appleMapsUrl = `http://maps.apple.com/?daddr=${encodedAddress}`;
        Linking.openURL(appleMapsUrl);
      });
    } else {
      Alert.alert('Error', 'Pickup address not available.');
    }
  };

  const handleNavigateToDropoff = () => {
    const address = getDropoffLocation(trip);
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      const mapsUrl = `https://maps.google.com/maps?daddr=${encodedAddress}`;
      Linking.openURL(mapsUrl).catch(() => {
        // Fallback to Apple Maps on iOS
        const appleMapsUrl = `http://maps.apple.com/?daddr=${encodedAddress}`;
        Linking.openURL(appleMapsUrl);
      });
    } else {
      Alert.alert('Error', 'Dropoff address not available.');
    }
  };

  const handleNavigateRoundTrip = () => {
    const pickupAddress = getPickupLocation(trip);
    const dropoffAddress = getDropoffLocation(trip);
    
    if (pickupAddress && dropoffAddress) {
      const encodedPickup = encodeURIComponent(pickupAddress);
      const encodedDropoff = encodeURIComponent(dropoffAddress);
      const mapsUrl = `https://maps.google.com/maps?saddr=${encodedPickup}&daddr=${encodedDropoff}`;
      Linking.openURL(mapsUrl).catch(() => {
        // Fallback to Apple Maps on iOS
        const appleMapsUrl = `http://maps.apple.com/?saddr=${encodedPickup}&daddr=${encodedDropoff}`;
        Linking.openURL(appleMapsUrl);
      });
    } else {
      Alert.alert('Error', 'Addresses not available for navigation.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3B82F6';
      case 'confirmed': return '#8B5CF6';
      case 'in_progress': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'no_show': return '#F97316';
      default: return '#999';
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
    if (trip.clients?.first_name && trip.clients?.last_name) {
      return `${trip.clients.first_name} ${trip.clients.last_name}`;
    }
    return trip.client_name || 'Unknown Client';
  };

  const getDisplayPhone = (trip: Trip) => {
    return trip.clients?.phone || trip.client_phone || 'No phone available';
  };

  if (!trip) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Trip not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
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
              <Ionicons name="person" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{getDisplayName(trip)}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{getDisplayPhone(trip)}</Text>
                <TouchableOpacity style={styles.callButton} onPress={handleCallClient}>
                  <Ionicons name="call" size={16} color="#3B82F6" />
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
            {trip.programs?.name && (
              <View style={styles.infoRow}>
                <Ionicons name="business" size={20} color="#666" />
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
              <Ionicons name="time" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Scheduled Time</Text>
                <Text style={styles.infoValue}>{formatTime(trip.scheduled_pickup_time)}</Text>
                <Text style={styles.infoSubtext}>{formatDate(trip.scheduled_pickup_time)}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="people" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Passengers</Text>
                <Text style={styles.infoValue}>{trip.passenger_count}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="car" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Trip Type</Text>
                <Text style={styles.infoValue}>{trip.trip_type.replace('_', ' ')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Locations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locations</Text>
          <View style={styles.infoCard}>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color="#3B82F6" />
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
                <Ionicons name="navigate" size={20} color="#3B82F6" />
                <Text style={styles.navButtonText}>Navigate</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="flag" size={20} color="#10B981" />
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
                <Ionicons name="navigate" size={20} color="#10B981" />
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
              <Ionicons name="warning" size={20} color="#F59E0B" />
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

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Round Trip Navigation Button */}
          {trip.trip_type === 'round_trip' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.navigationButton]}
              onPress={handleNavigateRoundTrip}
            >
              <Ionicons name="map" size={20} color="white" />
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
                <Ionicons name="play" size={20} color="white" />
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
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.actionButtonText}>Complete Trip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.completedContainer}>
              <Ionicons name="checkmark-circle" size={24} color={trip.status === 'no_show' ? '#F97316' : '#10B981'} />
              <Text style={styles.completedText}>Trip {trip.status === 'no_show' ? 'No Show' : trip.status}</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
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
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  callButtonText: {
    fontSize: 12,
    color: '#3B82F6',
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
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  requirementsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
  },
  requirementsText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  notesCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noShowButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#3B82F6',
  },
  completeButton: {
    backgroundColor: '#10B981',
  },
  navigationButton: {
    backgroundColor: '#8B5CF6',
    marginBottom: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
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
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 8,
  },
});




