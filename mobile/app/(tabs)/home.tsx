import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
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

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const { data: trips = [], isLoading, refetch } = useQuery<Trip[]>({
    queryKey: ['driver-trips'],
    queryFn: () => apiClient.getDriverTrips(),
    enabled: !!user,
  });

  // Filter trips for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTrips = trips.filter((trip) => {
    const tripDate = new Date(trip.scheduled_pickup_time);
    return tripDate >= today && tripDate < tomorrow;
  });

  // Get trip statistics
  const getDriverStats = () => {
    const totalTrips = trips.length;
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const inProgressTrips = trips.filter(t => t.status === 'in_progress').length;
    const scheduledTrips = trips.filter(t => t.status === 'scheduled' || t.status === 'confirmed').length;
    
    return { totalTrips, completedTrips, inProgressTrips, scheduledTrips };
  };

  const stats = getDriverStats();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        return theme.colors.tripStatus.scheduled;
      case 'in_progress':
        return theme.colors.tripStatus.inProgress;
      case 'completed':
        return theme.colors.tripStatus.completed;
      case 'cancelled':
      case 'no_show':
        return theme.colors.tripStatus.cancelled;
      default:
        return theme.colors.mutedForeground;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDisplayName = (trip: Trip) => {
    if (trip.clients?.first_name && trip.clients?.last_name) {
      return `${trip.clients.first_name} ${trip.clients.last_name}`;
    }
    return trip.client_name || 'Unknown Client';
  };

  const renderTrip = ({ item: trip }: { item: Trip }) => (
    <TouchableOpacity
      style={[styles.tripCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={() => router.push(`/(tabs)/trip-details?tripId=${trip.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.tripHeader}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(trip.status) }]} />
          <Text style={[styles.statusText, { color: theme.colors.foreground }]}>
            {trip.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.timeText, { color: theme.colors.foreground }]}>
          {formatTime(trip.scheduled_pickup_time)}
        </Text>
      </View>

      <View style={styles.clientInfo}>
        <Text style={[styles.clientName, { color: theme.colors.foreground }, theme.typography.body]}>
          {getDisplayName(trip)}
        </Text>
        <Text style={[styles.dateText, { color: theme.colors.mutedForeground }, theme.typography.bodySmall]}>
          {formatDate(trip.scheduled_pickup_time)}
        </Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={theme.colors.mutedForeground} />
          <Text style={[styles.locationText, { color: theme.colors.foreground }, theme.typography.bodySmall]} numberOfLines={1}>
            {trip.pickup_locations?.name || trip.pickup_address}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="flag" size={16} color={theme.colors.mutedForeground} />
          <Text style={[styles.locationText, { color: theme.colors.foreground }, theme.typography.bodySmall]} numberOfLines={1}>
            {trip.dropoff_locations?.name || trip.dropoff_address}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    statsCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardTitle: {
      ...theme.typography.h3,
      color: theme.colors.foreground,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statItem: {
      width: '48%',
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 8,
    },
    statNumber: {
      ...theme.typography.h2,
      color: theme.colors.primary,
      marginBottom: 4,
    },
    statLabel: {
      ...theme.typography.caption,
      color: theme.colors.mutedForeground,
    },
    sectionTitle: {
      ...theme.typography.h3,
      color: theme.colors.foreground,
      marginBottom: 12,
      marginTop: 8,
    },
    tripCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
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
      marginRight: 6,
    },
    statusText: {
      ...theme.typography.caption,
    },
    timeText: {
      ...theme.typography.body,
      fontWeight: '600',
    },
    clientInfo: {
      marginBottom: 12,
    },
    clientName: {
      marginBottom: 4,
      fontWeight: '600',
    },
    dateText: {
      marginTop: 2,
    },
    locationContainer: {
      gap: 8,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    locationText: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyStateText: {
      ...theme.typography.body,
      color: theme.colors.mutedForeground,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Trip Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Trip Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalTrips}</Text>
              <Text style={styles.statLabel}>Total Trips</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.completedTrips}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.inProgressTrips}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.scheduledTrips}</Text>
              <Text style={styles.statLabel}>Scheduled</Text>
            </View>
          </View>
        </View>

        {/* Today's Trips */}
        <Text style={styles.sectionTitle}>Today's Trips</Text>
        {todayTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.mutedForeground} />
            <Text style={styles.emptyStateText}>No trips scheduled for today</Text>
          </View>
        ) : (
          <FlatList
            data={todayTrips}
            renderItem={renderTrip}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScrollView>
    </View>
  );
}

