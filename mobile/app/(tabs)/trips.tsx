import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';

interface Trip {
  id: string;
  organizationId: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledPickupTime: string;
  scheduledReturnTime?: string;
  actualPickupTime?: string;
  actualDropoffTime?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  tripType: string;
  passengerCount: number;
  notes?: string;
  specialRequirements?: string;
}

export default function TripsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading, refetch } = useQuery({
    queryKey: ['driver-trips'],
    queryFn: () => apiClient.getDriverTrips(),
    enabled: !!user,
  });

  const updateTripMutation = useMutation({
    mutationFn: ({ tripId, status }: { tripId: string; status: string }) =>
      apiClient.updateTripStatus(tripId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-trips'] });
    },
  });

  const handleStatusUpdate = (tripId: string, currentStatus: string) => {
    let nextStatus = '';
    
    if (currentStatus === 'scheduled') {
      nextStatus = 'in_progress';
    } else if (currentStatus === 'in_progress') {
      nextStatus = 'completed';
    }

    if (nextStatus) {
      updateTripMutation.mutate({ tripId, status: nextStatus });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#ff9500';
      case 'in_progress': return '#007AFF';
      case 'completed': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return '#999';
    }
  };

  const getActionText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Start Trip';
      case 'in_progress': return 'Complete Trip';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return '';
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderTrip = ({ item: trip }: { item: Trip }) => (
    <View style={styles.tripCard}>
      <View style={styles.tripHeader}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(trip.status) }]} />
          <Text style={styles.statusText}>{trip.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.timeText}>
          {formatTime(trip.scheduledPickupTime)}
        </Text>
      </View>

      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{trip.clientName}</Text>
        {trip.clientPhone && <Text style={styles.clientPhone}>{trip.clientPhone}</Text>}
        <Text style={styles.dateText}>{formatDate(trip.scheduledPickupTime)}</Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>Pickup:</Text>
          <Text style={styles.locationText}>{trip.pickupLocation}</Text>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>Dropoff:</Text>
          <Text style={styles.locationText}>{trip.dropoffLocation}</Text>
        </View>
      </View>

      <View style={styles.tripFooter}>
        <Text style={styles.passengerText}>
          {trip.passengerCount} passenger{trip.passengerCount !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.tripTypeText}>
          {trip.tripType.replace('_', ' ')}
        </Text>
        
        {trip.status !== 'completed' && trip.status !== 'cancelled' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: getStatusColor(trip.status) }]}
            onPress={() => handleStatusUpdate(trip.id, trip.status)}
            disabled={updateTripMutation.isPending}
          >
            <Text style={styles.actionButtonText}>
              {getActionText(trip.status)}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {trip.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>{trip.notes}</Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading trips...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Trips</Text>
      
      <FlatList
        data={trips}
        renderItem={renderTrip}
        keyExtractor={(trip) => trip.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No trips scheduled</Text>
            <Text style={styles.emptySubtext}>New trips will appear here</Text>
          </View>
        }
      />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 10,
    color: '#333',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
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
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});