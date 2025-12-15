import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface Trip {
  id: string;
  scheduled_pickup_time: string;
  status: string;
  client_name?: string;
  is_group_trip?: boolean;
  client_group_id?: string;
  client_group_name?: string;
  clients?: {
    first_name: string;
    last_name: string;
  };
  pickup_address: string;
  dropoff_address: string;
}

interface TripCalendarProps {
  trips: Trip[];
  onTripPress: (tripId: string) => void;
  refreshControl?: React.ReactElement;
}

type ViewMode = 'day' | 'week' | 'month';

export default function TripCalendar({ trips, onTripPress, refreshControl }: TripCalendarProps) {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get trips for selected date
  const getTripsForDate = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return trips.filter((trip) => {
      const tripDate = new Date(trip.scheduled_pickup_time);
      return tripDate >= startOfDay && tripDate <= endOfDay;
    });
  };

  // Get trips for week
  const getTripsForWeek = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return trips.filter((trip) => {
      const tripDate = new Date(trip.scheduled_pickup_time);
      return tripDate >= startOfWeek && tripDate <= endOfWeek;
    });
  };

  // Get trips for month
  const getTripsForMonth = () => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return trips.filter((trip) => {
      const tripDate = new Date(trip.scheduled_pickup_time);
      return tripDate >= startOfMonth && tripDate <= endOfMonth;
    });
  };

  const getDisplayTrips = () => {
    switch (viewMode) {
      case 'day':
        return getTripsForDate(selectedDate);
      case 'week':
        return getTripsForWeek();
      case 'month':
        return getTripsForMonth();
      default:
        return [];
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'month') {
      newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const renderTrip = ({ item: trip }: { item: Trip }) => (
    <TouchableOpacity
      style={[styles.tripCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={() => onTripPress(trip.id)}
      activeOpacity={0.7}
    >
      <View style={styles.tripHeader}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(trip.status) }]} />
          <Text style={[styles.statusText, { color: theme.colors.foreground }, theme.typography.caption]}>
            {trip.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.timeText, { color: theme.colors.foreground }, theme.typography.body]}>
          {formatTime(trip.scheduled_pickup_time)}
        </Text>
      </View>

      <Text style={[styles.clientName, { color: theme.colors.foreground }, theme.typography.body]} numberOfLines={1}>
        {getDisplayName(trip)}
      </Text>

      <View style={styles.locationRow}>
        <Ionicons name="location" size={14} color={theme.colors.mutedForeground} />
        <Text style={[styles.locationText, { color: theme.colors.mutedForeground }, theme.typography.bodySmall]} numberOfLines={1}>
          {trip.pickup_address}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    viewModeSelector: {
      flexDirection: 'row',
      backgroundColor: theme.colors.muted,
      borderRadius: 8,
      padding: 4,
      marginBottom: 16,
    },
    viewModeButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
    },
    viewModeButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    viewModeButtonText: {
      ...theme.typography.caption,
      color: theme.colors.foreground,
    },
    viewModeButtonTextActive: {
      color: theme.colors.primaryForeground,
      fontWeight: '600',
    },
    dateNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    dateText: {
      ...theme.typography.h3,
      color: theme.colors.foreground,
      flex: 1,
      textAlign: 'center',
    },
    navButton: {
      padding: 8,
    },
    todayButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.colors.primary,
      borderRadius: 6,
    },
    todayButtonText: {
      ...theme.typography.caption,
      color: theme.colors.primaryForeground,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    tripCard: {
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
    },
    tripHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
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
      fontWeight: '600',
    },
    timeText: {
      fontWeight: '600',
    },
    clientName: {
      marginBottom: 6,
      fontWeight: '500',
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
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
      marginTop: 12,
    },
  });

  const displayTrips = getDisplayTrips();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* View Mode Selector */}
        <View style={styles.viewModeSelector}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'day' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('day')}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewModeButtonText, viewMode === 'day' && styles.viewModeButtonTextActive]}>
              Day
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'week' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('week')}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewModeButtonText, viewMode === 'week' && styles.viewModeButtonTextActive]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'month' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('month')}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewModeButtonText, viewMode === 'month' && styles.viewModeButtonTextActive]}>
              Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Navigation */}
        <View style={styles.dateNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateDate('prev')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.dateText}>
            {viewMode === 'day' && formatDate(selectedDate)}
            {viewMode === 'week' && `Week of ${formatDate(selectedDate)}`}
            {viewMode === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateDate('next')}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.todayButton}
          onPress={goToToday}
          activeOpacity={0.7}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {displayTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.mutedForeground} />
            <Text style={styles.emptyStateText}>
              No trips for {viewMode === 'day' ? 'this day' : viewMode === 'week' ? 'this week' : 'this month'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayTrips}
            renderItem={renderTrip}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          />
        )}
      </View>
    </View>
  );
}

