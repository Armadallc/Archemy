import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Linking,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { apiClient } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

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
  // Additional fields from API response
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

const { width } = Dimensions.get('window');

export default function TripsScreen() {
  const { user } = useAuth();
  const { unreadCount, isConnected } = useNotifications();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ tripId: string; status: string } | null>(null);

  const { data: trips = [], isLoading, error, refetch } = useQuery<Trip[]>({
    queryKey: ['driver-trips'],
    queryFn: () => {
      console.log('🔍 [Trips] Fetching trips, user:', user);
      return apiClient.getDriverTrips();
    },
    enabled: !!user,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Debug logging
  useEffect(() => {
    console.log('🔍 [Trips] Component state:', {
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
      isLoading,
      tripsCount: Array.isArray(trips) ? trips.length : 0,
      error: error ? (error instanceof Error ? error.message : String(error)) : null,
      queryEnabled: !!user,
    });
    
    if (error) {
      console.error('❌ [Trips] Error fetching trips:', error);
    }
    
    if (trips && Array.isArray(trips)) {
      console.log('✅ [Trips] Trips fetched successfully:', trips.length, 'trips');
    }
  }, [user, isLoading, trips, error]);

  const updateTripMutation = useMutation({
    mutationFn: ({ tripId, status }: { tripId: string; status: string }) =>
      apiClient.updateTripStatus(tripId, status),
    onSuccess: () => {
      console.log('✅ Trip status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['driver-trips'] });
      if (Platform.OS !== 'web') {
        Alert.alert('Success', 'Trip status updated successfully');
      }
    },
    onError: (error) => {
      console.error('❌ Failed to update trip status:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to update trip status');
      } else {
        window.alert('Failed to update trip status');
      }
    },
  });

  // Auto-refresh trips every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        refetch();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, refetch]);

  const handleStatusUpdate = (tripId: string, currentStatus: string, action?: 'no_show') => {
    console.log('🔍 [handleStatusUpdate] Called:', { tripId, currentStatus, action, platform: Platform.OS });
    let nextStatus = '';
    let actionText = '';
    
    if (action === 'no_show') {
      nextStatus = 'no_show';
      actionText = 'mark as no show';
    } else if (currentStatus === 'scheduled' || currentStatus === 'confirmed') {
      nextStatus = 'in_progress';
      actionText = 'Start Trip';
    } else if (currentStatus === 'in_progress') {
      nextStatus = 'completed';
      actionText = 'Complete Trip';
    }

    console.log('🔍 [handleStatusUpdate] Status transition:', { currentStatus, nextStatus, actionText });

    if (nextStatus) {
      console.log('🔍 [handleStatusUpdate] Showing confirmation dialog');
      // Store pending update and show modal (works consistently on web and native)
      setPendingStatusUpdate({ tripId, status: nextStatus });
      setShowConfirmModal(true);
    } else {
      console.log('⚠️ [handleStatusUpdate] No valid status transition for:', currentStatus);
    }
  };

  const confirmStatusUpdate = () => {
    if (pendingStatusUpdate) {
      console.log('✅ [handleStatusUpdate] User confirmed, calling mutation:', pendingStatusUpdate);
      updateTripMutation.mutate(
        pendingStatusUpdate,
        {
          onSuccess: (data) => {
            console.log('✅ [handleStatusUpdate] Mutation success:', data);
            setShowConfirmModal(false);
            setPendingStatusUpdate(null);
          },
          onError: (error) => {
            console.error('❌ [handleStatusUpdate] Mutation error:', error);
            setShowConfirmModal(false);
            setPendingStatusUpdate(null);
          },
        }
      );
    }
  };

  const cancelStatusUpdate = () => {
    console.log('❌ [handleStatusUpdate] User cancelled status update');
    setShowConfirmModal(false);
    setPendingStatusUpdate(null);
  };

  const handleCallClient = (phone: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Error', 'Client phone number not available');
    }
  };

  const handleNavigateToPickup = (trip: Trip) => {
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

  const handleNavigateToDropoff = (trip: Trip) => {
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

  const handleNavigateToTrip = (trip: Trip) => {
    const address = trip.pickup_address || trip.pickup_locations?.address;
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.google.com/maps?daddr=${encodedAddress}`;
      Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Pickup address not available');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#3B82F6'; // blue
      case 'confirmed': return '#8B5CF6'; // purple
      case 'in_progress': return '#F59E0B'; // amber
      case 'completed': return '#10B981'; // green
      case 'cancelled': return '#EF4444'; // red
      case 'no_show': return '#F97316'; // orange
      default: return '#999';
    }
  };

  const getActionText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Start Trip';
      case 'confirmed': return 'Start Trip';
      case 'in_progress': return 'Complete Trip';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return '';
    }
  };

  const getDisplayName = (trip: Trip) => {
    if (trip.clients?.first_name && trip.clients?.last_name) {
      return `${trip.clients.first_name} ${trip.clients.last_name}`;
    }
    return trip.client_name || 'Unknown Client';
  };

  const getDisplayPhone = (trip: Trip) => {
    return trip.clients?.phone || trip.client_phone || 'No phone';
  };

  const getPickupLocation = (trip: Trip) => {
    if (trip.pickup_locations?.name) {
      return trip.pickup_locations.name;
    }
    return trip.pickup_address || 'Unknown pickup location';
  };

  const getDropoffLocation = (trip: Trip) => {
    if (trip.dropoff_locations?.name) {
      return trip.dropoff_locations.name;
    }
    return trip.dropoff_address || 'Unknown dropoff location';
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderTrip = ({ item: trip }: { item: Trip }) => (
    <View style={styles.tripCard}>
      <TouchableOpacity 
        style={styles.tripCardContent}
        onPress={() => router.push(`/(tabs)/trip-details?tripId=${trip.id}`)}
        activeOpacity={0.7}
      >
      <View style={styles.tripHeader}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(trip.status) }]} />
          <Text style={styles.statusText}>{trip.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.timeText}>
          {formatTime(trip.scheduled_pickup_time)}
        </Text>
      </View>

      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{getDisplayName(trip)}</Text>
        <Text style={styles.clientPhone}>{getDisplayPhone(trip)}</Text>
        <Text style={styles.dateText}>{formatDate(trip.scheduled_pickup_time)}</Text>
        {trip.programs?.name && (
          <Text style={styles.programText}>{trip.programs.name}</Text>
        )}
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.locationText}>{getPickupLocation(trip)}</Text>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => handleNavigateToPickup(trip)}
          >
            <Ionicons name="navigate" size={14} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="flag" size={16} color="#666" />
          <Text style={styles.locationText}>{getDropoffLocation(trip)}</Text>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => handleNavigateToDropoff(trip)}
          >
            <Ionicons name="navigate" size={14} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <Text style={styles.passengerText}>
          {trip.passenger_count} passenger{trip.passenger_count !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.tripTypeText}>
          {trip.trip_type.replace('_', ' ')}
        </Text>
      </View>

      {trip.special_requirements && (
        <View style={styles.requirementsContainer}>
          <Ionicons name="warning" size={14} color="#F59E0B" />
          <Text style={styles.requirementsText}>{trip.special_requirements}</Text>
        </View>
      )}

      {trip.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>{trip.notes}</Text>
        </View>
      )}
      </TouchableOpacity>
      
      {(() => {
        const status = trip.status as string;
        const shouldShow = status !== 'completed' && status !== 'cancelled' && status !== 'no_show';
        const actionText = getActionText(status);
        
        if (!shouldShow) {
          console.log('🔍 [renderTrip] Not showing action buttons for trip:', trip.id, 'status:', status);
          return null;
        }
        
        if (!actionText) {
          console.log('🔍 [renderTrip] No action text for trip:', trip.id, 'status:', status);
          return null;
        }
        
        return (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: getStatusColor(status) }]}
              onPress={(e) => {
                e?.stopPropagation?.();
                console.log('🔍 Action button clicked:', { tripId: trip.id, status: status, disabled: updateTripMutation.isPending });
                if (!updateTripMutation.isPending) {
                  handleStatusUpdate(trip.id, status);
                } else {
                  console.log('⚠️ Button is disabled, mutation pending');
                }
              }}
              disabled={updateTripMutation.isPending}
              activeOpacity={0.8}
              onPressIn={() => console.log('🔍 Button press started')}
            >
              <Text style={styles.actionButtonText}>
                {actionText}
              </Text>
            </TouchableOpacity>
          
            {((trip.status as string) === 'scheduled' || (trip.status as string) === 'confirmed') && (
              <TouchableOpacity
                style={[styles.noShowButton, { backgroundColor: '#F97316' }]}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  if (!updateTripMutation.isPending) {
                    handleStatusUpdate(trip.id, trip.status, 'no_show');
                  }
                }}
                disabled={updateTripMutation.isPending}
                activeOpacity={0.8}
              >
                <Text style={styles.noShowButtonText}>N/S</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })()}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading trips...</Text>
      </View>
    );
  }

  const getTripStats = () => {
    const scheduled = trips.filter(t => (t.status as string) === 'scheduled' || (t.status as string) === 'confirmed').length;
    const inProgress = trips.filter(t => (t.status as string) === 'in_progress').length;
    const completed = trips.filter(t => (t.status as string) === 'completed').length;
    const cancelled = trips.filter(t => (t.status as string) === 'cancelled').length;
    return { scheduled, inProgress, completed, cancelled, total: trips.length };
  };

  const getTodaysTrips = () => {
    const today = new Date().toDateString();
    return trips.filter(trip => {
      const tripDate = new Date(trip.scheduled_pickup_time).toDateString();
      return tripDate === today;
    });
  };

  const getUpcomingTrips = () => {
    const now = new Date();
    return trips.filter(trip => {
      const tripTime = new Date(trip.scheduled_pickup_time);
      // Show trips that are not completed, cancelled, or no_show, regardless of time
      // This includes past trips that are still in progress
      return (trip.status as string) !== 'completed' && (trip.status as string) !== 'cancelled' && (trip.status as string) !== 'no_show';
    }).sort((a, b) => new Date(a.scheduled_pickup_time).getTime() - new Date(b.scheduled_pickup_time).getTime());
  };

  const stats = getTripStats();
  const todaysTrips = getTodaysTrips();
  const upcomingTrips = getUpcomingTrips();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My Trips</Text>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <Ionicons name="notifications" size={24} color="#3B82F6" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.headerBottom}>
          <Text style={styles.subtitle}>Welcome back, {user?.name || 'Driver'}</Text>
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionStatusDot, 
              { backgroundColor: isConnected ? '#10B981' : '#EF4444' }
            ]} />
            <Text style={styles.connectionStatusText}>
              {isConnected ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.scheduled}</Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <FlatList
        data={upcomingTrips as any}
        renderItem={renderTrip}
        keyExtractor={(trip) => trip.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No upcoming trips</Text>
            <Text style={styles.emptySubtext}>Your trips will appear here</Text>
          </View>
        }
      />

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelStatusUpdate}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Action</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to {pendingStatusUpdate?.status === 'in_progress' ? 'start' : pendingStatusUpdate?.status === 'completed' ? 'complete' : pendingStatusUpdate?.status === 'no_show' ? 'mark as no show' : 'update'} this trip?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={cancelStatusUpdate}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmStatusUpdate}
                disabled={updateTripMutation.isPending}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {updateTripMutation.isPending ? 'Updating...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionStatusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  tripCardContent: {
    padding: 16,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clientInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  programText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
    marginTop: 4,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  navButton: {
    padding: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginLeft: 8,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passengerText: {
    fontSize: 12,
    color: '#666',
  },
  tripTypeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  noShowButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noShowButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  notesText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  requirementsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  requirementsText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  tripContent: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  secondaryButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonConfirm: {
    backgroundColor: '#3B82F6',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

