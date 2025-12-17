import React, { useState, useEffect } from 'react';
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
import { logger } from '../../services/logger';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../contexts/NotificationContext';

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
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { unreadCount } = useNotifications();

  const { data: trips = [], isLoading, error: tripsError, refetch } = useQuery<Trip[]>({
    queryKey: ['driver-trips'],
    queryFn: () => apiClient.getDriverTrips(),
    enabled: !!user,
    onError: (error) => {
      console.error('❌ [Home] Error fetching trips:', error);
      logger.error('Failed to fetch driver trips', 'HomeScreen', { 
        error: error instanceof Error ? error.message : String(error),
        userId: user?.id 
      });
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Debug: Log trip data to see what we're receiving
  React.useEffect(() => {
    if (trips.length > 0 && __DEV__) {
      const groupTrips = trips.filter(t => t.is_group_trip);
      if (groupTrips.length > 0) {
        console.log('🔍 [Home] Group trips data:', groupTrips.map(t => ({
          id: t.id,
          is_group_trip: t.is_group_trip,
          client_group_id: t.client_group_id,
          client_group_name: t.client_group_name,
          client_name: t.client_name,
          clients: t.clients
        })));
      }
    }
  }, [trips]);
  
  // Log errors for debugging
  React.useEffect(() => {
    if (tripsError) {
      console.error('🚨 [Home] Trips query error:', {
        error: tripsError,
        message: tripsError instanceof Error ? tripsError.message : String(tripsError),
        userId: user?.id,
        userEmail: user?.email,
      });
    }
  }, [tripsError, user]);

  // Filter trips for today (handle timezone properly)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTrips = trips.filter((trip) => {
    if (!trip.scheduled_pickup_time) return false;
    try {
      const tripDate = new Date(trip.scheduled_pickup_time);
      // Compare dates only (ignore time for today's filter)
      const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isToday = tripDateOnly.getTime() === todayDateOnly.getTime();
      
      // Debug logging (only in development)
      if (__DEV__ && isToday) {
        console.log('📅 Trip matches today:', {
          tripId: trip.id,
          scheduledTime: trip.scheduled_pickup_time,
          tripDate: tripDateOnly.toISOString(),
          todayDate: todayDateOnly.toISOString(),
        });
      }
      
      return isToday;
    } catch (error) {
      console.error('Error parsing trip date:', trip.scheduled_pickup_time, error);
      return false;
    }
  });
  
  // Debug: Log trip filtering results
  if (__DEV__) {
    console.log('📊 Trip filtering:', {
      totalTrips: trips.length,
      todayTrips: todayTrips.length,
      today: today.toISOString(),
      sampleTripDates: trips.slice(0, 3).map(t => ({
        id: t.id,
        scheduled: t.scheduled_pickup_time,
        status: t.status,
      })),
    });
  }

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
    // Fallback if tripStatus is not available
    if (!theme.colors.tripStatus) {
      switch (status) {
        case 'scheduled':
        case 'confirmed':
          return theme.colors.scheduled || '#3b82f6';
        case 'in_progress':
          return theme.colors.inProgress || '#f59e0b';
        case 'completed':
          return theme.colors.completed || '#22c55e';
        case 'cancelled':
        case 'no_show':
          return theme.colors.cancelled || '#ef4444';
        default:
          return theme.colors.mutedForeground || '#8a8f94';
      }
    }
    
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        return theme.colors.tripStatus?.scheduled || theme.colors.scheduled || '#3b82f6';
      case 'in_progress':
        return theme.colors.tripStatus?.inProgress || theme.colors.inProgress || '#f59e0b';
      case 'completed':
        return theme.colors.tripStatus?.completed || theme.colors.completed || '#22c55e';
      case 'cancelled':
      case 'no_show':
        return theme.colors.tripStatus?.cancelled || theme.colors.cancelled || '#ef4444';
      default:
        return theme.colors.mutedForeground || '#8a8f94';
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
    // Debug log for troubleshooting
    if (trip.is_group_trip && __DEV__) {
      console.log('🔍 [Home] getDisplayName for group trip:', {
        id: trip.id,
        is_group_trip: trip.is_group_trip,
        client_group_id: trip.client_group_id,
        client_group_name: trip.client_group_name,
        client_name: trip.client_name,
        has_clients: !!trip.clients
      });
    }
    
    // For group trips, prioritize client_group_name, then client_name (which should be set by API)
    if (trip.is_group_trip) {
      if (trip.client_group_name) {
        console.log('✅ [Home] Using client_group_name:', trip.client_group_name);
        return trip.client_group_name;
      }
      // Fallback: API should set client_name to group name, but check it as fallback
      if (trip.client_name && trip.client_name !== 'Unknown Client' && trip.client_name.trim() !== '') {
        console.log('✅ [Home] Using client_name as fallback:', trip.client_name);
        return trip.client_name;
      }
      console.warn('⚠️ [Home] No group name found, returning Unknown Group');
      return 'Unknown Group';
    }
    // For individual trips, use client name
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
      paddingTop: insets.top,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      ...theme.typography.h2,
      color: theme.colors.foreground,
    },
    notificationBell: {
      position: 'relative',
      padding: 8,
    },
    badge: {
      position: 'absolute',
      top: 0,
      right: 0,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      borderWidth: 2,
      borderColor: theme.colors.card,
    },
    badgeText: {
      ...theme.typography.caption,
      color: theme.colors.primaryForeground,
      fontWeight: '700',
      fontSize: 11,
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

  // Show error state if trips query failed
  if (tripsError && !isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error || '#EF4444'} />
        <Text style={[styles.cardTitle, { color: theme.colors.error || '#EF4444', marginTop: 16 }]}>
          Error Loading Trips
        </Text>
        <Text style={[styles.emptyStateText, { marginTop: 8, textAlign: 'center' }]}>
          {tripsError instanceof Error ? tripsError.message : 'Failed to load trips. Please try again.'}
        </Text>
        <TouchableOpacity 
          style={[styles.tripCard, { backgroundColor: theme.colors.primary || '#3B82F6', marginTop: 20, paddingHorizontal: 24, paddingVertical: 12 }]}
          onPress={() => refetch()}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
        {__DEV__ && (
          <Text style={[styles.emptyStateText, { marginTop: 16, fontSize: 10, fontFamily: 'monospace' }]}>
            {JSON.stringify(tripsError, null, 2)}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Notification Bell */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Trips</Text>
        <TouchableOpacity
          style={styles.notificationBell}
          onPress={() => router.push('/(tabs)/notifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications" size={24} color={theme.colors.foreground} />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

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
        <Text style={styles.sectionTitle}>Scheduled Trips</Text>
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

